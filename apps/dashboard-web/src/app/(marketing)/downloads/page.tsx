'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Check, ExternalLink, Terminal, Shield } from 'lucide-react';

interface ReleaseAsset {
  name: string;
  platform: string;
  arch: string;
  url: string;
  size: string;
}

interface Release {
  version: string;
  publishedAt: string;
  assets: ReleaseAsset[];
  sha256: string;
}

const PLATFORMS: ReleaseAsset[] = [
  { name: 'niriksh-linux-x64', platform: 'Linux', arch: 'x86_64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-linux-x64', size: '' },
  { name: 'niriksh-linux-arm64', platform: 'Linux', arch: 'ARM64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-linux-arm64', size: '' },
  { name: 'niriksh-darwin-x64', platform: 'macOS', arch: 'Intel', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-darwin-x64', size: '' },
  { name: 'niriksh-darwin-arm64', platform: 'macOS', arch: 'Apple Silicon', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh-darwin-arm64', size: '' },
  { name: 'niriksh.exe', platform: 'Windows', arch: 'x86_64', url: 'https://github.com/Smx27/codeburn/releases/latest/download/niriksh.exe', size: '' },
];

const INSTALL_COMMANDS = {
  linux: 'curl -fsSL https://niriksh.titanbyte.in/install.sh | bash',
  macos: 'curl -fsSL https://niriksh.titanbyte.in/install.sh | bash',
  windows: 'irm https://niriksh.titanbyte.in/install.ps1 | iex',
};

export default function DownloadsPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    fetchReleaseInfo();
  }, []);

  const fetchReleaseInfo = async () => {
    try {
      const res = await fetch('https://api.github.com/repos/Smx27/codeburn/releases/latest');
      if (res.ok) {
        const data = await res.json();
        const assets = data.assets.map((a: { name: string; browser_download_url: string; size: number }) => {
          const platform = a.name.includes('linux') ? 'Linux' : a.name.includes('darwin') ? 'macOS' : 'Windows';
          const arch = a.name.includes('arm64') ? 'ARM64' : a.name.includes('x64') ? 'x86_64' : 'x86_64';
          return {
            name: a.name,
            platform,
            arch,
            url: a.browser_download_url,
            size: formatSize(a.size),
          };
        });
        setRelease({
          version: data.tag_name,
          publishedAt: new Date(data.published_at).toLocaleDateString(),
          assets,
          sha256: '',
        });
      }
    } catch {
      setRelease({
        version: 'latest',
        publishedAt: '',
        assets: PLATFORMS,
        sha256: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const assets = release?.assets || PLATFORMS;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-marketing py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Download Niriksh
            </h1>
            <p className="text-lg text-muted-foreground">
              Get the Niriksh agent for your platform. Track, analyze, and optimize AI usage across your organization.
            </p>
            {release?.version && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge variant="secondary">Version {release.version}</Badge>
                {release.publishedAt && (
                  <span className="text-sm text-muted-foreground">Released {release.publishedAt}</span>
                )}
              </div>
            )}
          </div>

          {/* Quick Install */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Quick Install
              </CardTitle>
              <CardDescription>
                Install Niriksh with a single command
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Linux / macOS</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
                      {INSTALL_COMMANDS.linux}
                    </code>
                    <button
                      onClick={() => copyToClipboard(INSTALL_COMMANDS.linux)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd === INSTALL_COMMANDS.linux ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Windows</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
                      {INSTALL_COMMANDS.windows}
                    </code>
                    <button
                      onClick={() => copyToClipboard(INSTALL_COMMANDS.windows)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd === INSTALL_COMMANDS.windows ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Downloads */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Direct Downloads
              </CardTitle>
              <CardDescription>
                Download the binary for your platform directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assets.map((asset) => (
                  <div
                    key={asset.name}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{asset.platform}</span>
                        <Badge variant="outline">{asset.arch}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{asset.name}</span>
                      {asset.size && (
                        <span className="text-xs text-muted-foreground">{asset.size}</span>
                      )}
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Download
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Post Install */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                After Installation
              </CardTitle>
              <CardDescription>
                Get started with Niriksh in three steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</div>
                  <div>
                    <p className="font-medium">Generate an API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Visit your dashboard to create an enrollment key for your organization.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</div>
                  <div>
                    <p className="font-medium">Login to Niriksh</p>
                    <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">niriksh login</code>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</div>
                  <div>
                    <p className="font-medium">Start Syncing</p>
                    <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">niriksh sync</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
