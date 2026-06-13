import { TopBar } from './TopBar';
import { FileInspector } from '../inspector/FileInspector';
import { ConstellationNav } from './ConstellationNav';
import { NavigatorPanel } from '../navigator/NavigatorPanel';
import { QualityControl } from '../controls/QualityControl';
import { Legend } from './Legend';
import { SearchCommand } from './SearchCommand';

export function ExplorerHUD() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between">
      {/* Top dashboard header bar */}
      <TopBar />

      {/* Main left constellation panel */}
      <ConstellationNav />

      {/* Main right detail inspector */}
      <FileInspector />

      {/* Spacial navigator bottom prompt system */}
      <NavigatorPanel />

      {/* Interactive Legend details */}
      <Legend />

      {/* Quality controls slider panel */}
      <QualityControl />

      {/* Floating search palette */}
      <SearchCommand />
    </div>
  );
}
export default ExplorerHUD;
