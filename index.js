var _ = require('lodash');
var moment = require('moment');

module.exports = {
  fromJson: fromJson,
  toJson: toJson
};

function fromJson(fields, json) {
  var str = '';

  _.forEach(fields, function(field) {
    var isUndefined = false;
    var property = field.level ? field.level + '.' : '';
    property += field.name;
    var value = _.get(json, property);

    if (!field.formatFn) {
      switch (field.type) {
        case 'bool':
        case 'boolean':
          value = value.trim();
          if (value === '') {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          } else {
            value = !value || value === '0' || value === 'false' || value === 'null' ? false : true;
          }
          break;

        case 'date':
        case 'datetime':
        case 'dateTime':
        case 'time':
          if (value) {
            value = new Date(value);
            if (isNaN(value.getTime())) {
              isUndefined = true;
              if (!_.isUndefined(field.default)) {
                value = field.default;
              }
            } else {
              value = moment(value);
              value = !value.isValid() ? 0 : value.format(field.format);
            }
          } else {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        case 'decimal':
        case 'double':
        case 'float':
          field.paddingPosition = field.paddingPosition || 'left';
          field.paddingSymbol = typeof field.paddingSymbol !== 'undefined' ? field.paddingSymbol : 0;
          value = parseFloat(value);
          if (isNaN(value)) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        case 'int':
        case 'integer':
        case 'long':
          field.paddingPosition = field.paddingPosition || 'left';
          field.paddingSymbol = typeof field.paddingSymbol !== 'undefined' ? field.paddingSymbol : 0;
          value = parseInt(value);
          if (isNaN(value)) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        default:
          if (field.trim !== false) {
            value = String(typeof value !== 'undefined' ? value : '').trim();
          }
          if (!value) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
      }
    } else if (typeof field.formatFn === 'function') {
      value = field.formatFn(value, field);
      if (typeof value === 'undefined') {
        isUndefined = true;
      }
    } else {
      var fn = global[field.formatFn];
      if (typeof fn === 'function') {
        value = fn(value, field);
        if (typeof value === 'undefined') {
          isUndefined = true;
        }
      }
    }

    field.paddingPosition = field.paddingPosition === 'left' ? 'left' : 'right';
    field.paddingSymbol = typeof field.paddingSymbol !== 'undefined' ? String(field.paddingSymbol).substr(0, 1) : ' ';

    value = value.toString();
    if (value.length > field.width) {
      value = value.substr(0, field.width);
    } else if (value.length < field.width) {
      var diff = Array(field.width - value.length + 1).join(field.paddingSymbol);
      value = field.paddingPosition === 'left' ? diff + value : value + diff;
    }

    str += value;
  });

  return str;
}

function toJson(fields, line) {
  var json = {};

  _.forEach(fields, function(field) {
    var isUndefined = false;
    var value = line.substr(0, field.width);

    if (!field.formatFn) {
      switch (field.type) {
        case 'bool':
        case 'boolean':
          value = value.trim();
          if (value === '') {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          } else {
            value = !value || value === '0' || value === 'false' || value === 'null' ? false : true;
          }
          break;

        case 'date':
          value = new Date(moment(value, field.format).format());
          if (isNaN(value.getTime())) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        case 'decimal':
        case 'double':
        case 'float':
          value = parseFloat(value);
          if (isNaN(value)) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        case 'int':
        case 'integer':
        case 'long':
          value = parseInt(value);
          if (isNaN(value)) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
          break;

        default:
          if (field.trim !== false) {
            value = value.trim();
          }
          if (!value) {
            isUndefined = true;
            if (!_.isUndefined(field.default)) {
              value = field.default;
            }
          }
      }
    } else if (typeof field.formatFn === 'function') {
      value = field.formatFn(value, field);
      if (typeof value === 'undefined') {
        isUndefined = true;
      }
    } else {
      var fn = global[field.formatFn];
      if (typeof fn === 'function') {
        value = fn(value, field);
        if (typeof value === 'undefined') {
          isUndefined = true;
        }
      }
    }

    if (!isUndefined || !field.notSetOnUndefined) {
      _.set(json, field.level ? field.level + '.' + field.name : field.name, value);
    }
    line = line.substr(field.width);
  });

  return json;
}
