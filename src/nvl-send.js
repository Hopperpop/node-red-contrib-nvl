const merge = require('lodash.merge');
const helper = require('./nvl-helper.js');
const ParseNvlDef = helper.ParseNvlDef;

module.exports = function(RED) {
    function nvlSender(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        node.mem = {}; //Storage for counters and previous values
        node.listId = config.listId;
        node.pack = config.pack !== 'false';
        node.port = config.port;

        // Retrieve the global datatypes
        node.globaltypes = RED.nodes.getNode(config.globaltypes);
        if (node.globaltypes) {
            node.gvl = node.globaltypes.datatypes;
        } else {
            node.gvl = "";
        }

        try{
            node.nvl = ParseNvlDef(config.definition, node, node.gvl, node.pack);
        }catch(err){
            node.error(err);
            node.nvl = null;
        }


        node.on('input', function(msg, send, done) {
            //Backwards compatibility 
            send = send || function() { node.send.apply(node,arguments) };

            //Collect and check nvl definition and listId
            let listId = msg.id || node.listId;
            let pack = msg.pack || node.pack;
            let nvl = {};
            if(typeof msg.nvl === 'string' || msg.nvl instanceof String){
                //Use dynamic nvl
                try{
                    nvl = ParseNvlDef(msg.nvl, node, node.gvl, pack);
                }catch(err){
                    if (done) {
                        // Node-RED 1.0 compatibles
                        done(err);
                    } else {
                        // Node-RED 0.x compatible
                        node.error(err, msg);
                    }
                    return;
                }
            }else{
                //Use static configured nvl
                nvl = node.nvl;
                //Check if definiton is valid
                if (nvl === null || typeof nvl !=='object'){
                    node.status({fill:"red",shape:"ring",text:"Invalid NVL"});
                    if (done) {done();}
                    return;
                }
            }

            //Create storage based on listId
            if(!(listId in node.mem)){
                node.mem[listId] = {counter: 0, data: nvl.getDefault()};
            }

            try{
                //Build data
                merge( node.mem[listId].data , msg.payload );
                let data                = nvl.convertToBuffer(node.mem[listId].data);
                node.mem[listId].data   = nvl.convertFromBuffer(data); //Throw away all non defined variables

                //Build all packages and send in seperate message
                for( var i = 0; i < nvl.packages.length; i++){

                    //Build header
                    let header = new Buffer.alloc(20);
                    header.write('\0-S3',0,4);                                         //Protocol identity code
                    //header.writeUInt32LE(0,4);                                       //ID (always 0 for PDO)
                    header.writeUInt16LE(listId,8);                                    //Index, COB-ID, listId
                    header.writeUInt16LE(i,10);                                        //SubIndex
                    header.writeUInt16LE(nvl.packages[i].varSize,12);                  //Number of variables
                    header.writeUInt16LE(nvl.packages[i].byteSize+20,14);              //Total length telegram  (header+data)
                    header.writeUInt16LE(node.mem[listId].counter,16);                 //Send counter
                    //Byte flags 
                    //Byte checksum

                    //Build full message and send
                    let newMsg = {...msg};
                    newMsg.payload = Buffer.concat([header, data.slice( nvl.packages[i].offset, nvl.packages[i].offset + nvl.packages[i].byteSize)]);
                    //Add port if defined
                    if (node.port){
                        newMsg.port = node.port;
                    }

                    send(newMsg);
                }

                //Increment counter for next itteration
                node.mem[listId].counter += 1;
                if(node.mem[listId].counter > 65535){
                    node.mem[listId].counter = 0;
                }

                if (done) {
                    done();
                }

            }catch(err){
                //Error during parsing
                node.status({fill:"red",shape:"ring",text:"Error"});
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
                return;
            }
        }); 
    }
    RED.nodes.registerType("nvl-send",nvlSender);
}
