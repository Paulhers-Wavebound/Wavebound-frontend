// Cloud file picker utilities for Dropbox Chooser and Google Drive Picker
// Both use publishable client-side keys (safe to embed in frontend code).
// Replace placeholders below with your actual keys.

const DROPBOX_APP_KEY = ''; // TODO: paste your Dropbox App Key
const GOOGLE_API_KEY = ''; // TODO: paste your Google API Key
const GOOGLE_CLIENT_ID = ''; // TODO: paste your Google OAuth Client ID

// --------------- Helpers ---------------

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// --------------- Dropbox ---------------

declare global {
  interface Window {
    Dropbox?: {
      choose: (opts: {
        success: (files: { link: string; name: string }[]) => void;
        cancel: () => void;
        linkType: string;
        multiselect: boolean;
        extensions?: string[];
        folderselect?: boolean;
      }) => void;
    };
  }
}

export async function pickFromDropbox(extensions: string[]): Promise<File | null> {
  if (!DROPBOX_APP_KEY) {
    throw new Error('Dropbox App Key not configured. Please add your key in cloudFilePickers.ts');
  }

  await loadScript(
    `https://www.dropbox.com/static/api/2/dropins.js`,
    'dropbox-sdk'
  );

  // The SDK needs the app key on the script tag; set it via data attribute
  const scriptEl = document.getElementById('dropbox-sdk') as HTMLScriptElement | null;
  if (scriptEl && !scriptEl.getAttribute('data-app-key')) {
    scriptEl.setAttribute('data-app-key', DROPBOX_APP_KEY);
  }

  return new Promise<File | null>((resolve, reject) => {
    if (!window.Dropbox) { reject(new Error('Dropbox SDK failed to load')); return; }

    window.Dropbox.choose({
      success: async (files) => {
        try {
          const chosen = files[0];
          const res = await fetch(chosen.link);
          const blob = await res.blob();
          resolve(new File([blob], chosen.name, { type: blob.type }));
        } catch (err) {
          reject(err);
        }
      },
      cancel: () => resolve(null),
      linkType: 'direct',
      multiselect: false,
      extensions,
    });
  });
}

// --------------- Google Drive ---------------

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

async function loadGoogleApis() {
  await loadScript('https://apis.google.com/js/api.js', 'gapi-script');
  await loadScript('https://accounts.google.com/gsi/client', 'gsi-script');
}

function gapiLoad(lib: string): Promise<void> {
  return new Promise((resolve, reject) => {
    window.gapi.load(lib, { callback: resolve, onerror: reject });
  });
}

export async function pickFromGoogleDrive(mimeTypes: string[]): Promise<File | null> {
  if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
    throw new Error('Google API keys not configured. Please add your keys in cloudFilePickers.ts');
  }

  await loadGoogleApis();
  await gapiLoad('picker');

  // Get an OAuth token via Google Identity Services
  const token: string = await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (resp: any) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });

  // Show the Picker
  return new Promise<File | null>((resolve, reject) => {
    const view = new window.google.picker.DocsView()
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false);
    
    if (mimeTypes.length > 0) {
      view.setMimeTypes(mimeTypes.join(','));
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setCallback(async (data: any) => {
        if (data.action === 'picked') {
          try {
            const doc = data.docs[0];
            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const blob = await res.blob();
            resolve(new File([blob], doc.name, { type: doc.mimeType || blob.type }));
          } catch (err) {
            reject(err);
          }
        } else if (data.action === 'cancel') {
          resolve(null);
        }
      })
      .build();
    
    picker.setVisible(true);
  });
}
