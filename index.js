var _ = require('lodash');
var moment = require('moment');

module.exports = {
  toJson: toJson
};

function toJson(fields, line) {
  var json = {};

  _.forEach(fields, function(field) {
    var value = line.substr(0, field.width);

    if (!field.formatFn) {
      switch (field.type) {
        case 'bool':
        case 'boolean':
          value = value.trim();
          if (value === '' && field.default) {
            value = field.default;
          } else {
            value = !value || value === '0' || value === 'false' || value === 'null' ? false : true;
          }
          break;

        case 'date':
          value = new Date(moment(value, field.format).format());
          if (isNaN(value.getTime()) && !_.isUndefined(field.default)) {
            value = field.default;
          }
          break;

        case 'decimal':
        case 'double':
        case 'float':
          value = parseFloat(value);
          if (isNaN(value) && !_.isUndefined(field.default)) {
            value = field.default;
          }
          break;

        case 'int':
        case 'integer':
        case 'long':
          value = parseInt(value);
          if (isNaN(value) && !_.isUndefined(field.default)) {
            value = field.default;
          }
          break;

        default:
          value = String(value);
          if (field.trim !== false) {
            value = value.trim();
          }
          if (!value && !_.isUndefined(field.default)) {
            value = field.default;
          }
      }
    } else if (typeof field.formatFn === 'function') {
      value = field.formatFn(value, field);
    } else {
      var fn = global[field.formatFn];
      if (typeof fn === 'function') {
        value = fn(value, field);
      }
    }

    _.set(json, field.level ? field.level + '.' + field.name : field.name, value);
    line = line.substr(field.width);
  });

  return json;
}
