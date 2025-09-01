import { useState, useEffect } from 'react';

interface DebugInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

const DebugInfo = ({ isVisible, onClose }: DebugInfoProps) => {
  const [debugData, setDebugData] = useState<any>({});

  useEffect(() => {
    if (isVisible) {
      const data = {
        userAgent: navigator.userAgent,
        isWebView: /(WebView|wv)/i.test(navigator.userAgent),
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        isHTTPS: location.protocol === 'https:',
        hasWebSocket: typeof WebSocket !== 'undefined',
        hasFetch: typeof fetch !== 'undefined',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        hasTouch: 'ontouchstart' in window,
        orientation: window.screen.orientation?.type || 'Unknown',
        connectionType: (navigator as any).connection?.effectiveType || 'Unknown',
        timestamp: new Date().toISOString()
      };
      setDebugData(data);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Debug Information</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2 text-sm">
          {Object.entries(debugData).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-300">{key}:</span>
              <span className="text-white font-mono">{String(value)}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded">
          <h4 className="text-yellow-300 font-semibold mb-2">Troubleshooting Tips:</h4>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• If WebView detected, try opening in regular browser</li>
            <li>• Ensure HTTPS is enabled for WebRTC</li>
            <li>• Grant microphone permissions when prompted</li>
            <li>• Check FlutterFlow WebView settings</li>
            <li>• Try the test page: /webview-test.html</li>
          </ul>
        </div>
        
        <button
          onClick={() => {
            const dataStr = JSON.stringify(debugData, null, 2);
            navigator.clipboard.writeText(dataStr);
            alert('Debug data copied to clipboard!');
          }}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Copy Debug Data
        </button>
      </div>
    </div>
  );
};

export default DebugInfo;
