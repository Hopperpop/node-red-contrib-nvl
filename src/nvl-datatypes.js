module.exports = function(RED) {
    function NVL_Datatypes(config) {
        var node = this;
        RED.nodes.createNode(node,config);
        node.name = config.name;
        node.datatypes = config.datatypes;
    }
    RED.nodes.registerType("nvl-datatypes",NVL_Datatypes);
}