const helper = require('./nvl-helper.js');
const ParseNvlDef = helper.ParseNvlDef;

module.exports = function(RED) {
    function nvlReceiver(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.datatypes = {};
        node.listId = config.listId;

        try{
            node.nvl = ParseNvlDef(config.definition, node);
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
                    nvl = ParseNvlDef(msg.nvl, node);
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
            if (!Buffer.isBuffer(msg.payload)){
                let err = new Error("Payload is not a buffer.")
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


            //Check matching list id
            if (msg.payload.readUInt16LE(8) != listId){
                node.status({fill:"yellow",shape:"dot",text:"Wrong list Id"});
                if (done){done()};
                return;
            }else{
                node.status({fill:"green",shape:"dot",text:""});
            }

            //Check if size matches
            let dataSize = msg.payload.length - 20;
            if(dataSize !== nvl.byteLength){
                let err = new Error(`Data size doesn\' match. Expected: ${nvl.byteLength} Got: ${dataSize}`);
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

            //Try to parse buffer
            try{

                msg.payload = nvl.convertFromBuffer(msg.payload.slice(20));
                send(msg);
                if (done) {
                    done();
                }

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

        }); 
    }
    RED.nodes.registerType("nvl-receive",nvlReceiver);
}
