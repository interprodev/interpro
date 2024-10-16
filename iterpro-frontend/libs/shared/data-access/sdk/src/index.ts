export * from './lib/index';
export { SocketConnection } from './lib/sockets/socket.connections';

// CLASSES
export * from './models/classes/contracts.model';
export * from './models/classes/metrics.model';
export * from './models/classes/multiple-file-upload';

// INTERFACES
export * from './models/interfaces/attachments';
export * from './models/interfaces/chart/chart.interface';
export * from './models/interfaces/dialog/dialog.interface';
export * from './models/interfaces/etl/competitions.interfaces';
export * from './models/interfaces/etl/etlDuration';
export * from './models/interfaces/etl/iBaseEtlPlayerService';
export * from './models/interfaces/etl/iBaseEtlTeamService';
export * from './models/interfaces/etl/interfaces';
export * from './models/interfaces/etl/raw-metric';
export * from './models/interfaces/guide.interface';
export * from './models/interfaces/queue-message';
export * from './models/interfaces/pdf-report/pdf-report';
export * from './models/interfaces/pdf-report/pdf-report-types';
export * from './models/interfaces/robustness-data';
export * from './models/interfaces/video/video.types';

// TEAM
export * from './models/interfaces/team/team.interface';
export * from './models/interfaces/team/preference-metrics.interface';

// GAME STATS
export * from './models/interfaces/game-stats/game-stats.interface';
export * from './models/interfaces/game-stats/legend.interface';

// TABLE
export * from './models/interfaces/table/table-column';
export * from './models/interfaces/table/table-player';

// CUSTOM REPORT TEMPLATES
export * from './models/interfaces/custom-report-templates/schema/color';
export * from './models/interfaces/custom-report-templates/schema/json-schema';
export * from './models/interfaces/custom-report-templates/schema/schema';
export * from './models/interfaces/custom-report-templates/performance-report-common';

// SCOUTING
export * from './models/interfaces/scouting/common.interface';
export * from './models/interfaces/scouting/game-report/scouting-game-report.interface';
export * from './models/interfaces/scouting/scouting-entire-profile-report.model';
export * from './models/interfaces/third-party/third-party-club-game.interface';
export * from './models/interfaces/scouting/third-party/third-party-game-detail.interface';

// MEDICAL
export * from './models/interfaces/medical/anamnesys';
export * from './models/interfaces/medical/atc_item';
export * from './models/interfaces/medical/availability';
export * from './models/interfaces/medical/medical-event';
export * from './models/interfaces/medical/medical-fields';
export * from './models/interfaces/medical/medical-prevention';
export * from './models/interfaces/medical/medical-treatments';
export * from './models/interfaces/medical/treatments';

// PLANNING
export * from './models/interfaces/manager/planning';

// PLAYER
export * from './models/interfaces/player/player-attributes';
export * from './models/interfaces/player/squad';
export * from './models/interfaces/player/third-party/third-party-search.interface';
export * from './models/interfaces/player/player-report/player-report.interface';

// LEGAL
export * from './models/interfaces/legal/contracts.interface';

// TRANSFERS
export * from './models/interfaces/transfers/transfers.interface';

// UPLOADS
export * from './models/interfaces/uploads/upload.interface';

// PERFORMANCE
export * from './models/interfaces/performance/player-wellness';
export * from './models/interfaces/performance/readiness';
