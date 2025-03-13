// https://casl.js.org/v6/en/advanced/ability-to-database-query
import { RawRule } from '@casl/ability';
import { rulesToQuery, type AbilityQuery } from '@casl/ability/extra';
import { Op } from 'sequelize';

import { type AppAbility, type Actions, type Subjects } from '@/services/ability';

/**
 * Tricky way to walk recursively over deeply nested object.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Parameters
 */
function symbolize(query: AbilityQuery<unknown>) {
  return JSON.parse(JSON.stringify(query), function keyToSymbol(key, value) {
    if (key[0] === '$') {
      const symbol = Op[key.slice(1)];
      this[symbol] = value;
      return;
    }

    return value;
  });
}

function ruleToSequelize(rule: RawRule) {
  return rule.inverted ? { $not: rule.conditions } : rule.conditions;
}

export function toSequelizeQuery(ability: AppAbility, action: Actions, subject: Subjects) {
  const query = rulesToQuery(ability, action, subject, ruleToSequelize);
  return query === null ? query : symbolize(query);
}

export async function accessibleBy(ability: AppAbility, action: Actions = 'read') {
  const query = toSequelizeQuery(ability, action, this);

  if (query === null) { // there is no accessible records, so no need to send query to db
    return [];
  }

  return this.findAll({
    where: query,
  });
}
