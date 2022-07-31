const iec = require('iec-61131-3');

/**
 * Parses the network variable list defintion and checks if valid.
 * @param  {string} definition - Network variable list definition declaired inside a structured with the name 'NVL'
 * @param  {object} [node] - Optional node object for status updates
 * @param  {string} [datatypes] - Optional global datatypes string
 * @param  {boolean} [pack=true] - Pack variables setting
 * @returns {object} - IEC object
 */
exports.ParseNvlDef = function (definition,node,datatypes,pack = true){
    try{
        //Combine global datatypes with nvl definition
        let def = definition + "/r/n" + (datatypes || "");
        //Replace VAR_GLOBAL to NVL structure type
        let re = /VAR_GLOBAL(.+?)END_VAR/gms;
        def = def.replace( re, "TYPE NVL\:\r\nSTRUCT\r\n$1\r\nEND_STRUCT\r\nEND_TYPE");
        //Parse definition
        let nvl = iec.fromString(def,'NVL');

        //Count variables
        //exports.iec_addVarType(nvl);
        exports.chopNvl(nvl,pack);

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

/**
 * Chops the nvl in packages of max 255 bytes and store id/byte size/variable size/offset of each package
 * @param  {object} nvl  - IEC object. Packages definition will be added under nvl.packages
 * @param  {boolean} [packed=true]  - Pack variables option
 * @returns {Array.<{byteSize: Number, varSize: Number, offset: Number}>} - Packages definition
 */
exports.chopNvl = function(nvl, packed = true){
    nvl.packages = [];
    let package = {
        byteSize : 0,
        varSize: 0,
        offset: 0
    };


    //Internal recursive function
    function _chopNvl(_nvl){
        switch(_nvl.type){
            case "STRUCT":
                let children = _nvl.children;
                for (const child in children){
                    arguments.callee(children[child]);
                }
                break;
    
            case "ARRAY":
                for( var i = 0; i < _nvl.totalSize; i++){
                    arguments.callee(_nvl.dataType);
                }
                break;
            
            default:
                //Check variable type length
                if (_nvl.byteLength > 256){
                    throw new Error(`Type "${_nvl.type}" is bigger than 256B: ${nvl.byteLength}B`);
                }
                //See if new package needs to be created
                if ( package.varSize > 0 && (!packed || (package.byteSize + _nvl.byteLength > 256))){
                    //Create new packages
                    nvl.packages.push({...package});
                    package.offset += package.byteSize;
                    package.varSize = 0;
                    package.byteSize = 0;
                }
                //Add variable to packages
                package.byteSize += _nvl.byteLength;
                package.varSize += 1;

                break;
        }
    }
    _chopNvl(nvl);
    //Push last packages
    if (package.varSize > 0 ){
        nvl.packages.push({...package});
    };
    return nvl.packages;
}
/**
 * returns true if Id is older than refId taking overflow of 16bit into account
 * @param  {number} id
 * @param  {number} refId
 * @returns {boolean} - Id is older than refId
 */
exports.isOldId = function( id, refId){
    return ((id + 65536 - refId) % 65536) > 32768;
}