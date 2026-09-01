/* ============================================================================
   RC CONFIG SCHEMA
   ----------------------------------------------------------------------------
   Defines every tab and field for the Netrek-style RC config editor, taken
   directly from the supplied variable list. A few notes on modeling choices
   (flagged here rather than scattered through the UI):

   - CHECKBOX fields store an on/off pair. Most use "on"/"off" (the netrek
     convention), but two fields in the source list (autoSetWar, enemyPhasers)
     used "1" as their default, so those are modeled as "1"/"0" pairs to keep
     round-tripping exact.

   - SELECT fields: the source list gives a current numeric value but not the
     enumerated choices (that mapping is defined by the game client itself,
     not in the data provided). Two exceptions where the meaning is standard
     Netrek knowledge: defaultShip uses real ship codes. Every other select
     is rendered as a numeric dropdown (0-5) with the given default
     pre-selected -- edit the `options` array below if you know the real
     enumeration for your client build.

   - The "Screens" tab's `*.mapped` fields were typed "varchar" in the source
     list even though their values are on/off. They're rendered here as
     checkboxes for usability; the generated file still writes the literal
     on/off value either way.

   - Dynamic, per-alias entries (server.{alias}, useRSA.{alias} on the Login
     tab, and mac.{slot}.{dest} macros on the Macros tab) are modeled as
     repeatable tables rather than fixed fields, since the source list gives
     a template rather than concrete instances. Add/remove rows as needed.
   ============================================================================ */

function numOptions(defaultVal, max) {
  max = max === undefined ? 5 : max;
  const set = new Set();
  for (let i = 0; i <= max; i++) set.add(String(i));
  set.add(String(defaultVal));
  return Array.from(set).sort((a, b) => Number(a) - Number(b));
}

var RC_SCHEMA = [
  {
    id: 'login', name: 'Login',
    note: 'The "Server" list below models the repeatable server.{alias} / useRSA.{alias} entries as rows you can add or remove.',
    fields: [
      { key: 'name', label: 'Screen Name', type: 'text', default: '', tooltip: 'Default character name' },
      { key: 'password', label: 'Password', type: 'text', default: '', sensitive: true, tooltip: 'Default password' },
      //{ key: 'login', label: 'login', type: 'text', default: '', tooltip: 'Login name' },
      { key: 'defaultShip', label: 'Default Ship', type: 'select', tooltip: 'Default Ship', default: 'CA', 
        options: [{id:'SC',name:'SC'},{id:'DD',name:'DD'},{id:'CA',name:'CA'},{id:'BB',name:'BB'},{id:'AS',name:'AS'}],
      },
      { key: 'autoQuit', label: 'Auto Quit (seconds)', type: 'text', default: '60', tooltip: 'Autoquit timer (default 60)' },
      { key: 'autoSetWar', label: 'Auto Set War', type: 'select', default: '1',
        options: [{id: 0, name: "Do not set"}, {id: 1, name: "Non-zero player teams"},{id: 2, name: "Largest enemy team"}],
        tooltip: "&num; Declare war with enemy races when you first join<br/>&num; 0 - Don't set war<br/>&num; 1 - Set war with nonzero player teams, peace w/ 0 player teams<br/>&num; 2 - Set war with largest enemy team,  peace w/ everyone else" },
      { key: 'keepPeace', label: 'Keep Peace', type: 'checkbox', default: 'on', tooltip: "Keep Peace after Death" },
      { key: 'server', label: 'Default Server (COW)', type: 'text', default: '', tooltip: "Found only in COW" },
    ],
    dynamic: 'servers'
  },
  {
    id: 'keyboard', name: 'Keyboard',
    fields: [
      { key: 'keymap', label: 'Keymap', type: 'text', default: '', tooltip: 'Key remapping<br />Remap a key (x) to another (s) = xs<br />Example: tTs% d' },
      { key: 'disableWinkey', label: 'Disable Windows Key', type: 'checkbox', default: 'on', tooltip: 'Disable Windows and Context Keys' },
      { key: 'ignoreCaps', label: 'Ignore Caps Lock', type: 'checkbox', default: 'on', tooltip: 'Ignore Caps Lock key state' },
    ]
  },
  {
    id: 'mouse', name: 'Mouse',
    fields: [
      { key: 'buttonmap', label: 'Button Map', type: 'text', default: '1t2p3k',
        tooltip: 'Mouse button remapping<br />Remap a button (1) to a command (t) = 1t<br />Example: 1t2p3k<br/><br />Several of these may not work depending upon the client.<br />Available buttons:<br />1 = left            2 = middle           3 = right<br />4 = Shift+Left      5 = Shift+Middle     6 = Shift+Right<br />7 = Control+Left    8 = Control+Middle   9 = Control+Right<br />a = Shft+Ctrl+Left  b = Shft+Ctrl+Middle c = Shft+Ctrl+Right<br />[ Windows client included netrekrc adds 4p = shift+Left for phaser. ]<br />'
      },
      { key: 'allowWheelActions', label: 'Allow Wheel Actions', type: 'checkbox', default: 'on', tooltip: 'Allow mouse wheel to produce action in non-scrollable windows' },
      { key: 'clickDelay', label: 'Click Delay', type: 'text', default: '0', tooltip: 'Delay before continuous mouse clicks, in updates (0 = no delay)' },
      { key: 'continuousMouse', label: 'Continuous Mouse', type: 'checkbox', default: 'on', tooltip: 'Use mouse for continuous steering and firing' },
      { key: 'continuousMouseFix', label: 'Continuous Mouse Fix', type: 'checkbox', default: 'on', tooltip: 'Mode allow more than one button to be pressed' },
      { key: 'motionThresh', label: 'Motion Threshold', type: 'text', default: '16', tooltip: 'Mouse motion threshold' },
      { key: 'mouseAsShift', label: 'Mouse As Shift', type: 'checkbox', default: 'off', tooltip: 'Use mouse buttons as Shift keys' },
      { key: 'shiftedMouse', label: 'Shifted Mouse', type: 'checkbox', default: 'on', tooltip: 'Shift+Mouse gives additional commands' },
      { key: 'warp', label: 'Warp Cursor (COW)', type: 'checkbox', default: 'off', tooltip: 'Mouse Cursor Warp (COW)' },
    ]
  },
  {
    id: 'options', name: 'Options',
    fields: [
      { key: 'varyShields', label: 'Vary Shields', type: 'checkbox', default: 'on', tooltip: 'Change shields graphic on shield damage' },
      { key: 'varyShieldsColor', label: 'Vary Shields Color', type: 'checkbox', default: 'on', tooltip: 'Change shields color on shield damage' },
      { key: 'warnHull', label: 'Warn Hull', type: 'checkbox', default: 'off', tooltip: 'Warn hull state based on damage' },
      { key: 'warnShields', label: 'Warn Shields', type: 'checkbox', default: 'off', tooltip: 'Change shields color on enemy approach, overrides varyShieldsColor' },
      { key: 'cloakChars', label: 'Cloak Characters', type: 'text', default: '??', tooltip: 'Two characters to show cloaked player on map window' },
    ]
  },
  {
    id: 'weapons', name: 'Weapons',
    fields: [
      { key: 'continueTractor', label: 'Continue Tractor', type: 'checkbox', default: 'on', tooltip: 'Show tractor beam at all times when locked. If off, it will only show tractor beam for a short time.' },
      { key: 'enemyPhasers', label: 'Enemy Phasers', type: 'checkbox', default: '1', onValue: '1', offValue: '0', tooltip: 'Angle between enemy phaser lines' },
      { key: 'highlightFriendlyPhasers', label: 'Highlight Friendly Phasers', type: 'checkbox', default: 'off', tooltip: 'Highlight friendly phasers' },
      { key: 'phaserShrink', label: 'Phaser Shrink', type: 'text', default: '0', tooltip: 'Shrink our phaser by x/16 of its length<br />0-16 range for COW style phaser shrink<br /> 0-11 range for BRMH style phaser shrink' },
      { key: 'phaserShrinkStyle', label: 'Phaser Shrink Style (COW)', type: 'select', default: '0', tooltip: 'Style of phaser shrinkage<br />0 - COW style<br />1 - BRMH style',
      options: [
            {id: 0, name: "COW Style"},
            {id: 1, name: "BRMH Style"},
            ]      
      },
      { key: 'PhaserMsg', label: 'Phaser Message', type: 'select', default: '5', tooltip: 'Phaser Messages (client dependent)<br />0 = none<br />1 = all<br />2 = team<br />3 = indiv<br />4 = kill<br />5 = total',
      options: [
            {id: 0, name: "None"},
            {id: 1, name: "All"},
            {id: 2, name: "Team"},
            {id: 3, name: "Individual"},
            {id: 4, name: "Kill"},
            {id: 5, name: "Total"},
            ]
      },
      { key: 'phaserMsgI', label: 'Phaser Message (Info) - (COW)', type: 'checkbox', default: 'on', tooltip: 'Phaser Messages in Individual Window (COW)' },
      { key: 'phaserStats', label: 'Phaser Stats', type: 'checkbox', default: 'on', tooltip: 'Log phaser statistics' },
      { key: 'shrinkPhaserOnMiss', label: 'Shrink Phaser On Miss', type: 'checkbox', default: 'off', tooltip: 'Shrink phasers if missed' },
      { key: 'theirPhaserShrink', label: "Their Phaser Shrink", type: 'text', default: '0', tooltip: 'Shrink enemy phaser by x/16 of its length<br />1-16 range' },
      { key: 'colorfulPhasers', label: 'Colorful Phasers', type: 'checkbox', default: 'off', tooltip: 'Display color phasers' },
      { key: 'colorWeapons', label: 'Color Weapons', type: 'checkbox', default: 'off', tooltip: 'Use colored bitmaps for torps and plasmas' },
      { key: 'detCircle', label: 'Detonation Circle', type: 'checkbox', default: 'on', tooltip: 'Show det circle around your ship' },
      { key: 'infoRange', label: 'Info Range', type: 'checkbox', default: 'on', tooltip: 'Show weapon\'s range boundary as a dashed white box' },
      { key: 'showAllTractorPressor', label: 'Show All Tractor/Pressor', type: 'checkbox', default: 'on', tooltip: 'Show tractor/pressor for all players' },
      { key: 'showShields', label: 'Show Shields (COW)', type: 'checkbox', default: 'on', tooltip: 'Show Shields' },
      { key: 'showTractorPressor', label: 'Show Tractor/Pressor', type: 'checkbox', default: 'on', tooltip: 'Draw lines for tractor/pressor' },
      { key: 'tpDotDist', label: 'Tractor/Pressor Dot Distance', type: 'text', default: '10', tooltip: 'Distance between tractor/pressor dots' },
      { key: 'tractorID', label: 'Tractor ID', type: 'checkbox', default: 'on', tooltip: 'Show the ID of player you are tractoring as a number below your ship' },
    ]
  },
  {
    id: 'map', name: 'Map',
    fields: [
      { key: 'viewBox', label: 'View Box', type: 'checkbox', default: 'on', tooltip: 'Show limits of tactical display on galaxy' },
      { key: 'viewRange', label: 'View Range', type: 'select', default: '2', tooltip: 'Show range at which enemies can see you as a circle on map',
        options: [
        {id: 0, name: "Do not show"},
        {id: 1, name: "Show when cloaked"},
        {id: 2, name: "Show when carrying"},
        {id: 3, name: "Show always"},
        ]
      },
      
      { key: 'galacticFrequent', label: 'Galactic Frequency (COW)', type: 'checkbox', default: 'on', tooltip: 'Update Galactic map frequently.  This is good for phaser locking cloakers.' },
      { key: 'newPlanetBitmaps', label: 'New Planet Bitmaps (COW)', type: 'checkbox', default: 'on', tooltip: 'Use new Planet Bitmaps' },
      { key: 'planetBitmap', label: 'Planet Bitmap', type: 'select', default: '3', tooltip: 'Type of planet bitmaps on local map<br />0 - Bronco (default)<br />1 - Moo<br />2 - Rabbitear<br />3 - New color',
        options: [
            {id: 0, name: "Bronco"},
            {id: 1, name: "Moo"},
            {id: 2, name: "Rabbitear"},
            {id: 3, name: "New Color"},            
        ]
      },
      { key: 'planetBitmapGalaxy', label: 'Planet Bitmap (Galaxy)', type: 'select', default: '3',
        tooltip: 'Type of planet bitmaps on galactic map<br />0 - Bronco (default)<br />1 - Moo<br />2 - Rabbitear<br />3 - New color',
         options: [
            {id: 0, name: "Bronco"},
            {id: 1, name: "Moo"},
            {id: 2, name: "Rabbitear"},
            {id: 3, name: "New Color"},            
        ]
      },
      { key: 'planetHighlighting', label: 'Planet Highlighting', type: 'checkbox', default: 'on', tooltip: 'Highlight galactic planets by race and army status' },
      { key: 'ROMVLVS', label: 'ROMVLVS (COW)', type: 'checkbox', default: 'on', tooltip: 'ROMVLVS bitmaps for Rom Team (COW)' },
      { key: 'rotatePlanets', label: 'Rotate Planets', type: 'checkbox', default: 'on', tooltip: 'Rotate planets (only works with new planet bitmaps)' },
      { key: 'showStars', label: 'Show Stars', type: 'checkbox', default: 'on', tooltip: 'Draw background stars' },
      { key: 'weaponsOnMap', label: 'Weapons On Map', type: 'checkbox', default: 'on', tooltip: 'Show phasers, torps and plasmas on galactic map' },
      { key: 'autoRotate', label: 'Auto Rotate', type: 'checkbox', default: 'on', tooltip: 'Automatically rotate galaxy so teams are on left side of map' },
      { key: 'omitTeamLetter', label: 'Omit Team Letter', type: 'checkbox', default: 'off', tooltip: 'Omit team letter on galaxy' },
      { key: 'scaleFactor', label: 'Scale Factor', type: 'text', default: '40', tooltip: 'Scale of local map graphics<br/>10-40 range' },
      { key: 'showArmy', label: 'Show Army', type: 'select', default: '3',
        options: [
            {id: 0, name: "Do not show counts"},
            {id: 1, name: "Show on local only"},
            {id: 2, name: "Show on galactic only"},
            {id: 3, name: "Show on both"},            
        ],
        tooltip: 'Where to show army counts next to planets<br />Server god decides whether to fully enable this feature<br />If server god has feature off, army counts will only show on<br />planet you are orbiting (or locked onto as an observer)<br />0 - don\'t show army counts<br />1 - show army counts on local map only<br />2 - show army counts on galactic map only<br />3 - show army counts on both maps'
      },
      { key: 'showIND', label: 'Show Independent', type: 'checkbox', default: 'off', tooltip: 'Cross independent planets with X' },
      { key: 'fillTriangle', label: 'Fill Triangle (COW)', type: 'checkbox', default: 'off', tooltip: 'Fill Lock Triangle (COW)' },
      { key: 'showLock', label: 'Show Lock', type: 'select', default: '3',
        tooltip: 'Where to show lock triangle<br />0 = don\'t show<br />1 = galactic only<br />2 = tactical only<br />3 = both',
        options: [
            {id: 0, name: "Do not show"},
            {id: 1, name: "Galactic only"},
            {id: 2, name: "Local only"},
            {id: 3, name: "Show on both"},            
        ],
      },
      { key: 'showLocal', label: 'Show Local (COW)', type: 'select', default: '1',
        tooltip: 'This option sets what is shown on the local planet bitmaps<br />0 = show owner<br />1 = show recources<br />2 = show nothing',
        options: [
            {id: 0, name: "Show owner"},
            {id: 1, name: "Show resources"},
            {id: 2, name: "Show nothing"},
        ],
      },
      { key: 'showMapPlanetNames', label: 'Show Map Planet Names (COW)', type: 'checkbox', default: 'on', tooltip: 'Show Map Planet Names (COW)' },
      { key: 'showMySpeed', label: 'Show My Speed', type: 'checkbox', default: 'on', tooltip: 'Show my speed on local' },
      { key: 'showOtherSpeed', label: 'Show Other Speed', type: 'checkbox', default: 'on', tooltip: 'Show other player\'s speed on local' },
      { key: 'showPlanetNames', label: 'Show Planet Names', type: 'checkbox', default: 'on', tooltip: 'Show planet names on local' },
      { key: 'showPlanetOwner', label: 'Show Planet Owner', type: 'checkbox', default: 'off', tooltip: 'Show planet owner on galaxy' },
      { key: 'showPlayerStatus', label: 'Show Player Status (COW)', type: 'checkbox', default: 'on', tooltip: 'Show Player Status<br />This option, when on, shows players in the player list who are not alive.' },
      { key: 'showGalactic', label: 'Show Galactic', type: 'select', default: '1',
        tooltip: 'Show Galactic<br />This option sets what is shown on the planet bitmaps<br />0 = show owner<br />1 = show recources<br />2 = show nothing',
        options: [
            {id: 0, name: "Show owner"},
            {id: 1, name: "Show resources"},
            {id: 2, name: "Show nothing"},
        ],
      },
    ]
  },
  
  
  {
    id: 'hockey', name: 'Hockey',
    fields: [
      { key: 'puckArrow', label: 'Puck Arrow', type: 'checkbox', default: 'on', tooltip: 'Put a small tic mark on the puck to indicate its direction' },
      { key: 'puckCircle', label: 'Puck Circle', type: 'checkbox', default: 'off', tooltip: 'Show the puck\'s max shot range as a circle around your ship' },
      { key: 'showHockeyLinesMap', label: 'Show Hockey Lines (Map)', type: 'checkbox', default: 'off', tooltip: 'Show hockey lines on map' },
      { key: 'showHockeyLinesLocal', label: 'Show Hockey Lines (Local)', type: 'checkbox', default: 'off', tooltip: 'Show hockey lines on local' },
      { key: 'showHockeyScore', label: 'Show Hockey Score', type: 'checkbox', default: 'on', tooltip: 'Show hockey score on the galaxy top left corner' },
    ]
  },
  {
    id: 'playerlist', name: 'Player List',
    fields: [
      { key: 'partitionPlist', label: 'Partition Player List', type: 'checkbox', default: 'off', tooltip: 'Add space between teams in player list' },
      { key: 'playerListBlankZeroKills', label: 'Blank Zero Kills', type: 'checkbox', default: 'on', tooltip: 'Don\'t display player\'s kills if they have zero kills' },
      { key: 'playerListHack', label: 'Player List Hack', type: 'checkbox', default: 'off', tooltip: 'Suppose that players with letter greater than \'f\' are observers' },
      { key: 'playerListMessaging', label: 'Player List Messaging', type: 'checkbox', default: 'on', tooltip: 'Enable mouse clicks in player list to send messages' },
      { key: 'playerListObserver', label: 'Player List Observer', type: 'select', default: '3',
        tooltip: 'What kind of players to list<br />0 - all (default)<br />1 - players<br />2 - observers<br />3 - players, then observers<br />4 - playerlist is off',
        options: [
            {id: 0, name: "All"},
            {id: 1, name: "Players"},
            {id: 2, name: "Observers"},
            {id: 3, name: "Players First"},
            {id: 4, name: "Playerlist Off"},
        ],
      },
      { key: 'playerListStyle', label: 'Player List Style', type: 'select', default: '4',
        tooltip: 'Player List Style<br />0 = Custom player list<br />1 = Old player list<br />2 = Traditional COW player list<br />3 = Kill watch player list<br />4 = BRMH Player list"',
        options: [
            {id: 0, name: "Custom"},
            {id: 1, name: "Old Style"},
            {id: 2, name: "Traditional COW"},
            {id: 3, name: "Kill Watch List"},
            {id: 4, name: "BRMH Style"},
        ],
      },
      { key: 'playerList', label: 'Player List Columns', type: 'text', default: 'nTR N  K l,M',
        tooltip: 'Custom style for player list<br />  - White Space<br />b - Armies Bombed<br />d - Damage Inflicted (DI)<br />k - Max Kills<br />l - Login Name<br />n - Ship Number<br />p - Planets Taken<br />r - Ratio<br />s - Speed<br />v - Deaths per hour<br />w - War staus<br />B - Bombing<br />C - Curt (short) rank<br />D - Defense<br />H - Hours Played<br />K - Kills<br />L - Losses<br />M - Display, Host Machine<br />N - Name<br />O - Offense<br />P - Planets<br />R - Rank<br />S - Total Rating (stats)<br />T - Ship Type<br />V - Kills per hour<br />W - Wins'
      },
      { key: 'playerList2', label: 'Player List Columns (2)', type: 'text', default: 'n T R N l M K W L r O D,d',
        tooltip: 'Custom style for player list<br />  - White Space<br />b - Armies Bombed<br />d - Damage Inflicted (DI)<br />k - Max Kills<br />l - Login Name<br />n - Ship Number<br />p - Planets Taken<br />r - Ratio<br />s - Speed<br />v - Deaths per hour<br />w - War staus<br />B - Bombing<br />C - Curt (short) rank<br />D - Defense<br />H - Hours Played<br />K - Kills<br />L - Losses<br />M - Display, Host Machine<br />N - Name<br />O - Offense<br />P - Planets<br />R - Rank<br />S - Total Rating (stats)<br />T - Ship Type<br />V - Kills per hour<br />W - Wins'
      },
      { key: 'newPlayerList', label: 'New Player List (COW)', type: 'checkbox', default: 'off', tooltip: 'New Player List (COW)' },
      { key: 'newPlist', label: 'New Plist (COW)', type: 'checkbox', default: 'off', tooltip: 'New Player List (COW)' },
    ]
  },
  {
    id: 'system', name: 'System',
    fields: [
      { key: 'logging', label: 'Logging', type: 'checkbox', default: 'off', tooltip: 'Log all messages to file. Requires \'logfile\' option' },
      { key: 'logfile', label: 'Log Output', type: 'text', default: '', tooltip: 'Filename to save all log messages.' },
      { key: 'logMessage', label: 'Log Messages (COW)', type: 'checkbox', default: 'off', tooltip: 'Message Log (COW)' },
      { key: 'saveBig', label: 'Save Big', type: 'checkbox', default: 'on', tooltip: 'Save options with comments' },
      { key: 'saveWindow', label: 'Save Window Positions', type: 'checkbox', default: 'on', tooltip: 'Save window placements to saveFile' },
      { key: 'saveMacro', label: 'Save Macros', type: 'checkbox', default: 'on', tooltip: 'Save macros to saveFile' },
      { key: 'saveBeeplite', label: 'Save Beeplite', type: 'checkbox', default: 'on', tooltip: 'Save beeplite macros to saveFile' },
      { key: 'saveRCD', label: 'Save RCD', type: 'checkbox', default: 'on', tooltip: 'Save RCD to saveFile' },
      { key: 'saveRCM', label: 'Save RCM', type: 'checkbox', default: 'on', tooltip: 'Save RCM to saveFile' },
      { key: 'updatesPerSecond', label: 'Updates Per Second (COW)', type: 'text', default: '10', tooltip: 'Updates Per Second (COW)' },
      { key: 'saveFile', label: 'Save File', type: 'text', default: 'netrekrc.txt', tooltip: 'Save file (for using in-game save feature)' },
      { key: 'zeroArgUsage', label: 'Zero Argument Usage (COW)', type: 'checkbox', default: 'on', tooltip: 'Zero Argument Usage (COW)' },
    ]
  },
  {
    id: 'sound', name: 'Sound',
    fields: [
      { key: 'sound', label: 'Sound', type: 'checkbox', default: 'on', tooltip: 'Enable layered, stereo sound' },
      { key: 'soundVolume', label: 'Sound Volume', type: 'text', default: '64', tooltip: 'Starting sound volume' },
      { key: 'soundEffects', label: 'Sound Effects', type: 'checkbox', default: 'on', tooltip: 'Play sound effects' },
      { key: 'soundMusic', label: 'Sound Music', type: 'checkbox', default: 'on', tooltip: 'Play music' },
      { key: 'soundMusicBkgd', label: 'Sound Music (Background)', type: 'checkbox', default: 'off', tooltip: 'Play theme music in background (requires soundMusic)' },
      { key: 'soundAngles', label: 'Sound Angles', type: 'checkbox', default: 'on', tooltip: 'Use 3D sound effects' },
      { key: 'soundExclude', label: 'Sound Exclude', type: 'text', default: '', tooltip: 'Sound categories to turn off<br />e=explosions<br />w=weapons<br />a=alerts<br />m=messages<br />i=info<br />c=cloaking<br />s=shield<br />o=other ships' },
      { key: 'sounddir', label: 'Sound Directory', type: 'text', default: '.\\sounds', tooltip: 'Sound directory' },
    ]
  },
  {
    id: 'display', name: 'Display',
    fields: [
      { key: 'timerType', label: 'Timer Type', type: 'select', default: '1',
        tooltip: 'Type of dashboard timer to show<br />0 - don\'t show timer<br />1 - show current time<br />2 - show time on server<br />3 - show time in ship<br />4 - show user-set time<br />5 - show game-related timers',
        options: [
            {id: 0, name: "Do not show"},
            {id: 1, name: "Current Time"},
            {id: 2, name: "Server Time"},
            {id: 3, name: "Show in Ship"},
            {id: 4, name: "User-set Time"},
            {id: 5, name: "Game Related Timers"},
        ],
      },
      { key: 'clock', label: 'Clock', type: 'select', default: '2',
        tooltip: 'Which type of clock to show<br />0 = No clock<br />1 = hh:mm<br />2 = hh:mm:ss',
        options: [
            {id: 0, name: "No Clock"},
            {id: 1, name: "hh:mm"},
            {id: 2, name: "hh:mm:ss"},
        ],
      },
      { key: 'agriCAPS', label: 'Agri CAPS', type: 'checkbox', default: 'on', tooltip: 'Show AGRI planet names in caps on map' },
      { key: 'agriColor', label: 'Agri Color', type: 'select', default: '1',
        tooltip: 'Color of AGRI planet name on the map<br />0 - owner race color<br />1 - white<br />2 - gray',
        options: [
            {id: 0, name: "Owner Race"},
            {id: 1, name: "White"},
            {id: 2, name: "Grey"},
        ],
      },
      { key: 'colorClient', label: 'Color Client', type: 'select', default: '4',
        tooltip: 'What type of ship bitmaps to use<br />0 - mono<br />1 - new color bitmaps<br />2 - old color bitmaps<br />3 - shaded old color bitmaps<br />4 - experimental high res bitmaps (default)',
        options: [
            {id: 0, name: "Mono"},
            {id: 1, name: "New Color Bitmaps"},
            {id: 2, name: "Old Color Bitmaps"},
            {id: 3, name: "Shaded Old Bitmaps"},
            {id: 4, name: "High-res Bitmaps"},
        ],
      },
      { key: 'doubleBuffering', label: 'Double Buffering', type: 'checkbox', default: 'on', tooltip: 'Use double buffering to reduce screen flicker' },
      { key: 'dynamicBitmaps', label: 'Dynamic Bitmaps', type: 'checkbox', default: 'on', tooltip: 'Allow switching of ship bitmaps in game' },
      { key: 'extraAlertBorder', label: 'Extra Alert Border', type: 'checkbox', default: 'on', tooltip: 'Change window border on enemy approach' },
      { key: 'fontSize', label: 'Font Size', type: 'text', default: '10', tooltip: 'Height in pixels of font, default 10' },
      { key: 'forceDisplay', label: 'Force Display', type: 'select', default: '3',
        tooltip: 'Number of colors the client will display<br />0 - find best available color option<br />1 - 16 colors<br />2 - 256 colors<br />3 - true color (default)',
        options: [
            {id: 0, name: "Best Available"},
            {id: 1, name: "16 Colors"},
            {id: 2, name: "256 Colors"},
            {id: 3, name: "True Colors"},
        ],
      },
      { key: 'fullBitmapRotation', label: 'Full Bitmap Rotation', type: 'checkbox', default: 'on', tooltip: 'Draw old bitmap sets to 256 angles instead of 32' },
      { key: 'headingTic', label: 'Heading Tic', type: 'checkbox', default: 'off', tooltip: 'Draw a tic mark indicating your ship\'s direction' },
      { key: 'hideConsole', label: 'Hide Console', type: 'checkbox', default: 'off', tooltip: 'Hide the DOS console window' },
      { key: 'keepInfo', label: 'Keep Info', type: 'text', default: '15', tooltip: 'How many tenths of seconds to keep info window on (default 15)' },
      { key: 'lockLine', label: 'Lock Line', type: 'checkbox', default: 'on', tooltip: 'Draw dashed green line on map from your ship to lock target' },
      { key: 'mungScrollbarColors', label: 'Munge Scrollbar Colors', type: 'checkbox', default: 'off', tooltip: 'Paint dark scrollbars' },
      { key: 'dashboard', label: 'Dashboard (COW)', type: 'checkbox', default: 'on', tooltip: 'Dashboard (COW)' },
      { key: 'newDashboard', label: 'New Dashboard', type: 'select', default: '1',
        tooltip: 'Type of dashboard<br />0 - Text<br />1 - COW<br />2 - KRP<br />3 - LABs<br /><img src=\'dashboards.png\'>',
        options: [
            {id: 0, name: "Text"},
            {id: 1, name: "COW"},
            {id: 2, name: "KRP"},
            {id: 3, name: "LABs"},
        ],
      },
      { key: 'packetLights', label: 'Packet Lights', type: 'checkbox', default: 'on', tooltip: 'Show packets sent and received by blinking dashboard lights' },
      { key: 'redrawDelay', label: 'Redraw Delay', type: 'text', default: '0', tooltip: 'Number of updates before redraw' },
      { key: 'showCloakers', label: 'Show Cloakers', type: 'checkbox', default: 'on', tooltip: 'Show other cloakers on local' },
      { key: 'showMotd', label: 'Show MOTD', type: 'checkbox', default: 'on', tooltip: 'Show MOTD if waiting on queue' },
      { key: 'showFuelOnLocal', label: 'Show Fuel On Local (COW)', type: 'checkbox', default: 'off', tooltip: 'Show Fuel on Local (COW)' },
      { key: 'sortMyTeamFirst', label: 'Sort My Team First', type: 'checkbox', default: 'off', tooltip: 'Put my team first in the player list' },
      { key: 'sortPlanets', label: 'Sort Planets', type: 'checkbox', default: 'on', tooltip: 'Sort the planet list by team and army count' },
      { key: 'sortPlayers', label: 'Sort Players', type: 'checkbox', default: 'on', tooltip: 'Sort players by team' },
      { key: 'useTNGBitmaps', label: 'Use TNG Bitmaps (COW)', type: 'checkbox', default: 'on', tooltip: 'Use TNG style bitmaps (COW)' },
      { key: 'waitMotd', label: 'Wait For MOTD (COW)', type: 'checkbox', default: 'on', tooltip: 'Show MOTD (COW)' },
      { key: 'warpStreaks', label: 'Warp Streaks', type: 'checkbox', default: 'on', tooltip: 'Draw warp streaks while transwarping to starbase' },
      { key: 'color.white', label: 'Color: White', type: 'color', default: 'white', tooltip: 'White Color' },
      { key: 'color.black', label: 'Color: Black', type: 'color', default: 'black', tooltip: 'Black Color' },
      { key: 'color.red', label: 'Color: Red', type: 'color', default: 'red', tooltip: 'Red Color' },
      { key: 'color.green', label: 'Color: Green', type: 'color', default: 'green', tooltip: 'Green Color' },
      { key: 'color.yellow', label: 'Color: Yellow', type: 'color', default: 'yellow', tooltip: 'Yellow Color' },
      { key: 'color.cyan', label: 'Color: Cyan', type: 'color', default: 'cyan', tooltip: 'Cyan Color' },
      { key: 'color.light grey', label: 'Color: Light Grey', type: 'color', default: 'gray63', tooltip: 'Grey Color' },
      { key: 'color.God', label: 'Color: God', type: 'color', default: 'white', tooltip: 'God Color' },
      { key: 'color.Rom', label: 'Color: Romulan', type: 'color', default: 'red', tooltip: 'Romulan Color' },
      { key: 'color.Kli', label: 'Color: Klingon', type: 'color', default: 'green', tooltip: 'Klingon Color' },
      { key: 'color.Fed', label: 'Color: Federation', type: 'color', default: 'yellow', tooltip: 'Federation Color' },
      { key: 'color.Ori', label: 'Color: Orion', type: 'color', default: 'cyan', tooltip: 'Orion Color' },
      { key: 'color.Ind', label: 'Color: Independent', type: 'color', default: 'gray63', tooltip: 'Independent Color' },
    ]
  },
  {
    id: 'windows', name: 'Windows',
    fields: [
      { key: 'windowMove', label: 'Window Move', type: 'checkbox', default: 'on', tooltip: 'Enable internal windows moving' },
      { key: 'phaserWindow', label: 'Phaser Window', type: 'checkbox', default: 'off', tooltip: 'Show phaser window' },
      { key: 'newQuit', label: 'New Quit', type: 'checkbox', default: 'on', tooltip: 'Use new quit window' },
      { key: 'newTeams', label: 'New Teams', type: 'checkbox', default: 'on', tooltip: 'Use new team windows' },
      { key: 'showHints', label: 'Show Hints', type: 'checkbox', default: 'on', tooltip: 'Show hints window' },
      { key: 'showStats', label: 'Show Stats', type: 'checkbox', default: 'off', tooltip: 'Show statistics window' },
      { key: 'mainMaximized', label: 'Main Maximized', type: 'checkbox', default: 'on', tooltip: 'Make main window maximized on client start' },
      { key: 'mainResizeable', label: 'Main Resizeable', type: 'checkbox', default: 'on', tooltip: 'Make main window + local/map windows resizeable' },
      { key: 'mainTitleBar', label: 'Main Title Bar', type: 'checkbox', default: 'on', tooltip: 'Start main window with title bar on' },
      { key: 'maxScrollLines', label: 'Max Scroll Lines', type: 'text', default: '300', tooltip: 'Maximum number of scroll lines in a message window' },
    ]
  },
  {
    id: 'screens', name: 'Screens',
    note: 'Each sub-window has its own parent, geometry, and (where applicable) mapped/allow settings, matching the *.parent / *.geometry / *.mapped entries from the source list.',
    dynamic: 'screens'
  },
  {
    id: 'network', name: 'Network',
    fields: [
      { key: 'useRsa', label: 'Use RSA', type: 'checkbox', default: 'on', tooltip: 'Use RSA verification' },
      { key: 'useFullShipInfo', label: 'Use Full Ship Info', type: 'checkbox', default: 'on', tooltip: 'Display other ships to 256 directions instead of 16' },
      { key: 'useFullWeapInfo', label: 'Use Full Weapon Info', type: 'checkbox', default: 'on', tooltip: 'Observers use long torp packets instead of short torp packets' },
      { key: 'baseUdpLocalPort', label: 'Base UDP Local Port', type: 'text', default: '0', tooltip: 'Base UDP local port' },
      { key: 'port', label: 'Port', type: 'text', default: '2592', tooltip: 'Port to connect' },
      { key: 'portSwap', label: 'Port Swap', type: 'checkbox', default: 'on', tooltip: 'Use new UDP code' },
      { key: 'dontPing', label: "Don't Ping (COW)", type: 'checkbox', default: 'off', tooltip: 'Don\'t attempt to start ping packets from the server (COW)' },
      { key: 'tryShort', label: 'Try Short', type: 'checkbox', default: 'on', tooltip: 'Use short packets for communications' },
      { key: 'tryUdp', label: 'Try UDP', type: 'checkbox', default: 'on', tooltip: 'Use UDP for communications' },
      { key: 'udpClientReceive', label: 'UDP Client Receive', type: 'select', default: '2',
        tooltip: 'Type of incoming UDP traffic<br />0 - TCP<br />1 - simple UDP<br />2 - fat UDP',
        options: [
            {id: 0, name: "TCP"},
            {id: 1, name: "Simple UDP"},
            {id: 2, name: "Fat UDP"},
        ],
      },
      { key: 'udpClientSend', label: 'UDP Client Send', type: 'select', default: '3',
        tooltip: 'Type of outgoing UDP traffic<br />0 - TCP<br />1 - simple UDP<br />2 - enforced UDP (state)<br />3 - enfotrced UDP (state & weapons)',
        options: [
            {id: 0, name: "TCP"},
            {id: 1, name: "Simple UDP"},
            {id: 2, name: "Enforced UDP State"},
            {id: 3, name: "Enforced UDP State + Weapons"},
        ],
      },
      { key: 'udpDebug', label: 'UDP Debug', type: 'checkbox', default: 'off', tooltip: 'Print UDP debug information' },
      { key: 'udpSequenceCheck', label: 'UDP Sequence Check', type: 'checkbox', default: 'on', tooltip: 'Check sequence of UDP traffic' },
      { key: 'updatesPerSec', label: 'Updates Per Sec', type: 'text', default: '50', tooltip: 'How many updates per second to request' },
      { key: 'useCheckPlanets', label: 'Use Check Planets', type: 'checkbox', default: 'on', tooltip: 'Crosscheck with server to make sure all planet information is correct' },
      { key: 'useGeneric32', label: 'Use Generic32', type: 'checkbox', default: 'on', tooltip: 'Receive SP_GENERIC_32 packets' },
      { key: 'netstats', label: 'Net Stats', type: 'checkbox', default: 'off', tooltip: 'Keep lag statistics' },
      { key: 'netStatFreq', label: 'Net Stat Frequency (COW)', type: 'text', default: '3', tooltip: 'Network statistics frequency<br />1 (least) to 10 (most)' },
      { key: 'askForUpdate', label: 'Ask For Update (COW)', type: 'checkbox', default: 'on', tooltip: 'Ask For Full Update (COW)' },
    ]
  },
  {
    id: 'meta', name: 'Meta',
    fields: [
      { key: 'metaPort', label: 'Meta Port', type: 'text', default: '3521', tooltip: 'Metaserver port' },
      { key: 'metaStatusLevel', label: 'Meta Status Level', type: 'select', default: '1',
        tooltip: 'Meta Server List level<br />Tells the client what to list when using the MetaServer.<br />0   Servers which have players but not a wait queue.<br />1   + Servers with a wait queue.<br />2   + Servers with nobody playing.<br />3   + Servers which have Timed Out for the MetaServer.<br />4   + Servers which the MetaServer has not been able to connect to.',
        options: [
            {id: 0, name: "Has Players, no-wait queue"},
            {id: 1, name: "With wait queue"},
            {id: 2, name: "Nobody Playing"},
            {id: 3, name: "Timed Out Servers"},
            {id: 4, name: "Meta Timeout"},
        ],
      },
      { key: 'metaType', label: 'Meta Type', type: 'select', default: '1',
        tooltip: 'What type of metaserver to use',
        options: [
            {id: 1, name: "UDP multiple metaservers"},
            {id: 2, name: "Cache, then TCP metaserver"},
            {id: 3, name: "TCP metaserver, then cache"},
        ],
      },
      { key: 'metaPing', label: 'Meta Ping', type: 'checkbox', default: 'on', tooltip: 'Use ICMP to ping the metaserver list' },
      { key: 'metaVerbose', label: 'Meta Verbose', type: 'checkbox', default: 'off', tooltip: 'Show detailed messages during connect to metaserver' },
      { key: 'metaCache', label: 'Meta Cache', type: 'text', default: 'metacache', tooltip: 'Metacache file' },
      { key: 'metaUDPCache', label: 'Meta UDP Cache', type: 'text', default: 'metaUDPcache', tooltip: 'UDP Metacache file' },
    ]
  },
  {
    id: 'messages', name: 'Messages',
    fields: [
      { key: 'newMesgFlags', label: 'New Message Flags (COW)', type: 'checkbox', default: 'on', tooltip: 'New Message Flags (COW)' },
      { key: 'newDistress', label: 'New Distress', type: 'checkbox', default: 'off', tooltip: 'Indent RCD messages' },
      { key: 'beepOnPrivateMessage', label: 'Beep On Private Message', type: 'checkbox', default: 'off', tooltip: 'Beep if received private message' },
      { key: 'messageHoldThresh', label: 'Message Hold Threshold', type: 'text', default: '0', tooltip: 'Message hold threshold' },
      { key: 'messageHUD', label: 'Message HUD', type: 'select', default: '2',
        tooltip: 'Output message to local window while typing<br />0 - nowhere<br />1 - top of the window<br />2 - bottom of the window',
        options: [
            {id: 0, name: "Nowhere"},
            {id: 1, name: "Top of Window"},
            {id: 2, name: "Bottom of Window"},
        ],
      },
      { key: 'messageKeyOnly', label: 'Message Key Only', type: 'checkbox', default: 'on', tooltip: 'Only start messages if cursor is in the message window' },
      { key: 'reportKills', label: 'Report Kills', type: 'checkbox', default: 'on', tooltip: 'Report kills' },
      { key: 'shortKillMesg', label: 'Short Kill Message (COW)', type: 'checkbox', default: 'on', tooltip: 'Short Kill Messages (COW)' },
      { key: 'richText', label: 'Rich Text', type: 'checkbox', default: 'on', tooltip: 'Use rich text message windows' },
      { key: 'richTextMove', label: 'Rich Text Move', type: 'checkbox', default: 'off', tooltip: 'Enable rich text windows moving' },
      { key: 'useLite', label: 'Use Lite', type: 'checkbox', default: 'on', tooltip: 'Use beeplite' },
      { key: 'useMsgw', label: 'Use Msgw (COW)', type: 'checkbox', default: 'off', tooltip: 'Display last message (COW)' },
      { key: 'defLite', label: 'Default Lite', type: 'checkbox', default: 'on', tooltip: 'Use default beeplite settings' },
    ]
  },
  {
    id: 'macros', name: 'Macros',
    note: 'The macro table below models the repeatable mac.{slot}.{dest} entries described in the docs (e.g. mac.1.A: text sent to All via X1).',
    fields: [
      { key: 'macroKey', label: 'Macro Key', type: 'text', default: 'X', tooltip: 'Key to switch to macro mode' },
      { key: 'rejectMacro', label: 'Reject Macro', type: 'checkbox', default: 'off', tooltip: 'Reject macros' },
      { key: 'singleMacro', label: 'Single Macro', type: 'text', default: '', tooltip: 'Keys that will trigger macro without going to macro mode' },
    ],
    dynamic: 'macros'
  },
];

/* Screens tab: fixed list of sub-windows, each with its own parent/geometry/
   mapped/allow fields, taken directly from the source list (13.a - 13.ssss). */
var SCREEN_WINDOWS = [
  { name: 'netrek', parent: 'netrek', geometry: '1024x768' },
  { name: 'local', parent: 'netrek', geometry: '500x500' },
  { name: 'map', parent: 'netrek', geometry: '500x500' },
  { name: 'tstat', parent: 'netrek', geometry: 'auto' },
  { name: 'message', parent: 'netrek', geometry: 'auto', mapped: 'on' },
  { name: 'warn', parent: 'netrek', geometry: 'auto' },
  { name: 'planet', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'rank', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'player', parent: 'netrek', geometry: 'auto', mapped: 'on' },
  { name: 'player2', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'help', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'review_all', parent: 'netrek', geometry: 'auto', mapped: 'on' },
  { name: 'review_team', parent: 'netrek', geometry: 'auto', mapped: 'on' },
  { name: 'review_your', parent: 'netrek', geometry: 'auto', mapped: 'on' },
  { name: 'review_kill', parent: 'netrek', geometry: 'auto', mapped: 'on', allow: 'KP' },
  { name: 'review_phaser', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'review', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'pingStats', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'UDP', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'network', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'DocWin', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'xtrekrcWin', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'fed', parent: 'local', geometry: 'auto' },
  { name: 'kli', parent: 'local', geometry: 'auto' },
  { name: 'ori', parent: 'local', geometry: 'auto' },
  { name: 'rom', parent: 'local', geometry: 'auto' },
  { name: 'quit', parent: 'local', geometry: 'auto' },
  { name: 'stats', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'sstat', parent: 'netrek', geometry: 'auto' },
  { name: 'war', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'sound', parent: 'netrek', geometry: 'auto', mapped: 'off' },
  { name: 'macro', parent: 'netrek', mapped: 'off' },
  { name: 'option', parent: 'netrek', geometry: 'auto' },
  { name: 'lagMeter', parent: 'netrek', geometry: 'auto' },
  { name: 'buttonkeymap', parent: 'netrek', geometry: 'auto' },
  { name: 'xtrekrc_help', parent: 'netrek', geometry: 'auto' },
  { name: 'MetaServer List', parent: 'netrek', geometry: 'auto' },
  { name: 'tools', parent: 'netrek', geometry: 'auto' },
];
