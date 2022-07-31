const helper = require('./nvl-helper.js');
const ParseNvlDef = helper.ParseNvlDef;

module.exports = function(RED) {
    function nvlReceiver(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.datatypes = {};
        node.mem = {}; //Storage for counters and previous values
        node.listId = config.listId;
        node.pack = config.pack !== 'false';


        // Retrieve the global datatypes
        node.globaltypes = RED.nodes.getNode(config.globaltypes);
        if (node.globaltypes) {
            node.gvl = node.globaltypes.datatypes;
        } else {
            node.gvl = "";
        }

        // Parse static nvl definition
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
            let nvl = {};
            if(typeof msg.nvl === 'string' || msg.nvl instanceof String){
                //Use dynamic nvl
                try{
                    nvl = ParseNvlDef(msg.nvl, node, node.gvl, node.pack);
                }catch(err){
                    if (done) {
                        // Node-RED 1.0 compatible
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

            //Check if payload is buffer
            if (!Buffer.isBuffer(msg.payload) || msg.payload.length < 20){
                let err = new Error("Payload is not a valid buffer.")
                node.status({fill:"red",shape:"dot",text:"Error"});
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
                return;
            }

            let tele = {
                listId:     msg.payload.readUInt16LE(8),        //Index, COB-ID, listId
                subId:      msg.payload.readUInt16LE(10),       //SubIndex
                varSize:    msg.payload.readUInt16LE(12),       //Number of variables
                size:       msg.payload.readUInt16LE(14),       //Total length telegram  (header+data)
                counter:    msg.payload.readUInt16LE(16)        //Send counter
            }

            //Check matching list id
            if (tele.listId != listId){
                node.status({fill:"yellow",shape:"dot",text:"Wrong list Id"});
                if (done){done()};
                return;
            }

            //Check if valid packages
            let err = null;
            let dataSize = msg.payload.length - 20;
            if( tele.subId >= nvl.packages.length){
                err = new Error(`Telegram has a subIndex higher than expected: ${tele.subId}`);
            } else if ( tele.size !== msg.payload.length ){
                err = new Error(`Telegram size (${msg.payload.length}B) is different than the value in the header (${tele.size}B).`);
            } else if ( dataSize !== nvl.packages[tele.subId].byteSize ){
                err = new Error(`Telegram datasize doesn\'t match with nvl definition for subIndex ${tele.subId}. Expected: ${nvl.packages[tele.subId].byteSize}B Got: ${dataSize}B`);
            }

            if( err ){
                node.status({fill:"red",shape:"dot",text:"Error"});
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
                return;
            }
  
            //Create new listId storage space if needed
            if (!(listId in node.mem)){
                node.mem[listId] = {
                    cntFull: -1, //Last fully received packages counter
                };
            }

            //Create new counter storage space if needed
            if (!(tele.counter in node.mem[listId])){
                node.mem[listId][tele.counter] = {
                    recSubId: new Set(),                        //Storage for received package id numbers
                    data: Buffer.alloc( nvl.byteLength )        //Data storage
                }                
            }


            let packageData = node.mem[listId][tele.counter];

            //Add data to buffer if not older/delayed data, and subId not already received

            if ( !helper.isOldId(tele.counter, node.mem[listId].cntFull) && (!packageData.recSubId.has(tele.subId))){
                //counterData.data.write( msg.payload.slice(20) , nvl.packages[tele.subId].offset);
                msg.payload.slice(20).copy(packageData.data, nvl.packages[tele.subId].offset);
                packageData.recSubId.add(tele.subId);

                //Check if it's the last package
                if (packageData.recSubId.size === Object.keys(nvl.packages).length){
                    
                    //Save succesfull packages assembly and remove older data
                    node.mem[listId].cntFull = tele.counter;
                    Object.keys(node.mem[listId]).forEach(key => {
                        if ( helper.isOldId(key, tele.counter) ){
                            delete node.mem[listId];
                        }
                    });

                    //Try to parse buffer and send
                    try{
                        msg.payload = nvl.convertFromBuffer(packageData.data);
                        send(msg);
                        if (done) {
                            done();
                        }
                        node.status({fill:"green",shape:"dot",text:""});

                    }catch(err){

                        //Error during parsing
                        node.status({fill:"red",shape:"dot",text:"Error"});
                        if (done) {
                            // Node-RED 1.0 compatible
                            done(err);
                        } else {
                            // Node-RED 0.x compatible
                            node.error(err, msg);
                        }
                        return;
                    }
                }else{
                    if (done) { done(); }
                }
            }else{
                if (done) { done(); }
            }

        }); 
    }
    RED.nodes.registerType("nvl-receive",nvlReceiver);
}
