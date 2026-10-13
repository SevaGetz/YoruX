const tid = (id) => `[data-testid="${id}"]`;
const href = (h) => `nav a[href="${h}"]`;

export const ITEMS = [
  { id: 'home', sel: tid('AppTabBar_Home_Link') },
  { id: 'explore', sel: tid('AppTabBar_Explore_Link') },
  { id: 'notifications', sel: tid('AppTabBar_Notifications_Link') },
  { id: 'follow', sel: tid('AppTabBar_Follow_Link') },
  { id: 'chat', sel: tid('AppTabBar_DirectMessage_Link') },
  { id: 'calls', sel: tid('AppTabBar_Calls_Link') },
  { id: 'grok', sel: href('/i/grok') },
  { id: 'history', sel: href('/i/history') },
  { id: 'studio', sel: href('/i/jf/creators/studio') },
  { id: 'premium', sel: tid('premium-signup-tab') },
  { id: 'profile', sel: tid('AppTabBar_Profile_Link') },
  { id: 'more', sel: tid('AppTabBar_More_Menu'), hint: true },

  { id: 'bookmarks', sel: href('/i/bookmarks') },
  { id: 'jobs', sel: href('/jobs') },
  { id: 'spaces', sel: href('/i/spaces') },
  { id: 'lists', sel: 'nav a[href$="/lists"]' },
  { id: 'communities', sel: 'nav a[href$="/communities"]' },

  { id: 'post', sel: tid('SideNav_NewTweet_Button') },
  { id: 'account', sel: tid('SideNav_AccountSwitcher_Button') },
];

export const keyOf = (id) => 'hide_' + id;
