const iec = require('iec-61131-3');

/**
 * Parses the network variable list defintion and checks if valid.
 * @param  {string} definition - Network variable list definition declaired inside a structured with the name 'NVL'
 * @param  {object} [node] - Optional node object for status updates
 * @param  {string} [datatypes] - Optional global datatypes string
 * @returns {object} - IEC object
 */
exports.ParseNvlDef = function (definition,node,datatypes){
    try{
        //Combine global datatypes with nvl definition
        let def = definition + "/r/n" + (datatypes || "");
        //Replace VAR_GLOBAL to NVL structure type
        let re = /VAR_GLOBAL(.+?)END_VAR/gms;
        def = def.replace( re, "TYPE NVL\:\r\nSTRUCT\r\n$1\r\nEND_STRUCT\r\nEND_TYPE");
        //Parse definition
        let nvl = iec.fromString(def,'NVL');

        //Check size
        if (nvl.byteLength > 256){
            if(node){node.status({fill:"red",shape:"ring",text:"To big"})};
            throw new Error(`NVl data size is to big: ${nvl.byteLength} bytes > 256`);
        }

        //Count variables
        exports.iec_addVarType(nvl);

        //Set status
        if(node){node.status({fill:"green",shape:"dot",text:""})};
        return nvl;
        
    }catch(err){
        if(node){node.status({fill:"red",shape:"ring",text:"Invalid NVL"})};
        throw err;
    }
};

/**
 * Adds the subproperty 'varCount' to the iec object with the total variable count
 * @param  {object} nvl - IEC object
 */
exports.iec_addVarType = function (nvl){
    let count = 0;
    switch(nvl.type){
        case "STRUCT":
            let children = nvl.children;
            for (const child in children){
                count += arguments.callee(children[child]);
            }
            nvl.varCount = count;
            break;

        case "ARRAY":
            count = nvl.totalSize * arguments.callee(nvl.dataType);
            nvl.varCount = count;
            break;
        
        default:
            count = 1;
            break;
    }
    return count;
};