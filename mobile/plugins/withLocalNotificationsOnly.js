/**
 * Dose reminders use local notifications only (no APNs / remote push).
 * expo-notifications adds aps-environment by default, which forces the Push
 * Notifications capability — unsupported on a free Personal Team.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
}

module.exports = withLocalNotificationsOnly;
