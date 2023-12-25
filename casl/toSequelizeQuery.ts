import { rulesToFields, rulesToQuery } from '@casl/ability/extra';
import { Op } from 'sequelize';

/**
 * Tricky way to walk recursively over deeply nested object.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Parameters
 */
function symbolize(query) {
  return JSON.parse(JSON.stringify(query), function keyToSymbol(key, value) {
    if (key[0] === '$') {
      const symbol = Op[key.slice(1)];
      this[symbol] = value;
      return;
    }

    return value;
  });
}

function ruleToSequelize(rule) {
  console.log('rule', rule);
  return rule.inverted ? { $not: rule.conditions } : rule.conditions;
}

export function toSequelizeQuery(ability, action, subject) {
  console.log('ability123', action, subject);
  const query = rulesToQuery(ability, action, subject, ruleToSequelize);
  console.log('query', query);
  return query === null ? query : symbolize(query);
}

export async function accessibleBy(ability, action = 'read') {
  const query = toSequelizeQuery(ability, action, this);

  if (query === null) { // there is no accessible records, so no need to send query to db
    return [];
  }

  return this.findAll({
    where: query,
  });
}
