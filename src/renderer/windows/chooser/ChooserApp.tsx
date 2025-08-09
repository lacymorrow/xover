import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/globals.scss';
import { useMemo, useState } from 'react';

export default function ChooserApp() {
  const { crosshairImages } = useGlobalContext();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return crosshairImages;
    return crosshairImages.filter((x) =>
      String(x.value).toLowerCase().includes(query.toLowerCase()),
    );
  }, [crosshairImages, query]);

  return (
    <div className="p-6 h-screen bg-background text-foreground flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold">Choose Crosshair</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="secondary"
              onClick={() => window.electron.ipcRenderer.send('open-file', '')}
            >
              Custom Image…
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[65vh] pr-4">
            <div className="grid grid-cols-4 gap-4">
              {filtered.map((img) => (
                <button
                  key={img.value}
                  type="button"
                  className="flex flex-col items-center gap-2 border rounded p-2 hover:bg-accent"
                  onClick={() => {
                    window.electron.setWindowState({ crosshair: img.value });
                  }}
                >
                  <img src={`file://${img.value}`} alt="" className="w-16 h-16 object-contain" />
                  <span className="text-xs truncate max-w-[10rem]">
                    {String(img.value).split('/').pop()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}


