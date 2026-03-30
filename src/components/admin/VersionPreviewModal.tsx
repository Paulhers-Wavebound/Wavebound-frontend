import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RotateCcw } from 'lucide-react';
import {
  DeliverableVersion,
  DELIVERABLE_TYPE_CONFIG,
  CREATED_BY_CONFIG,
  formatBytes,
  downloadBlob,
} from '@/utils/adminVersionHistory';

interface Props {
  version: DeliverableVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevert: (version: DeliverableVersion) => void;
}

export function VersionPreviewModal({ version, open, onOpenChange, onRevert }: Props) {
  const [tab, setTab] = useState<'html' | 'json'>('html');

  if (!version) return null;

  const typeConfig = DELIVERABLE_TYPE_CONFIG[version.deliverable_type];
  const createdByConfig = CREATED_BY_CONFIG[version.created_by] || CREATED_BY_CONFIG.pipeline;
  const hasHtml = !!version.content_html;
  const hasJson = !!version.content;
  const activeTab = hasHtml ? tab : 'json';

  const timeAgo = new Date(version.created_at).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col bg-[#0a0a0a] border-[#1C1C1E] text-[#ede8dc]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Version {version.version_number}</span>
            <Badge style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color, borderColor: `${typeConfig.color}50` }}>
              {typeConfig.label}
            </Badge>
            <Badge className={createdByConfig.className}>{createdByConfig.label}</Badge>
          </DialogTitle>
          <p className="text-xs text-[#a8a29e]">
            {timeAgo} · {version.content_html ? formatBytes(version.content_html.length) + ' HTML' : ''}
            {version.content ? (version.content_html ? ' + ' : '') + formatBytes(JSON.stringify(version.content).length) + ' JSON' : ''}
          </p>
          {version.notes && <p className="text-xs text-[#a8a29e] italic mt-1">{version.notes}</p>}
        </DialogHeader>

        {/* Tabs */}
        {hasHtml && hasJson && (
          <div className="flex gap-1 border-b border-[#1C1C1E] pb-2">
            <button
              onClick={() => setTab('html')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'html' ? 'bg-[#1C1C1E] text-[#ede8dc]' : 'text-[#a8a29e] hover:text-[#ede8dc]'}`}
            >
              HTML Preview
            </button>
            <button
              onClick={() => setTab('json')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'json' ? 'bg-[#1C1C1E] text-[#ede8dc]' : 'text-[#a8a29e] hover:text-[#ede8dc]'}`}
            >
              JSON Data
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === 'html' && hasHtml ? (
            <iframe
              srcDoc={version.content_html!}
              className="w-full h-full bg-white rounded-lg"
              style={{ minHeight: '60vh' }}
              title={`Version ${version.version_number} preview`}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : hasJson ? (
            <pre className="text-xs font-mono text-[#a8a29e] overflow-auto h-full p-4 bg-[#1C1C1E] rounded-lg" style={{ minHeight: '60vh' }}>
              {JSON.stringify(version.content, null, 2)}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-64 text-[#a8a29e] text-sm">
              This version has no previewable content.
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          {hasHtml && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadBlob(version.content_html!, `${version.artist_handle}_${version.deliverable_type}_v${version.version_number}.html`, 'text/html')}
              className="border-[#1C1C1E] text-[#ede8dc] hover:bg-[#1C1C1E]"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> HTML
            </Button>
          )}
          {hasJson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadBlob(JSON.stringify(version.content, null, 2), `${version.artist_handle}_${version.deliverable_type}_v${version.version_number}.json`, 'application/json')}
              className="border-[#1C1C1E] text-[#ede8dc] hover:bg-[#1C1C1E]"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> JSON
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onRevert(version)}
            className="bg-orange-600 hover:bg-orange-700 text-white ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore this version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
