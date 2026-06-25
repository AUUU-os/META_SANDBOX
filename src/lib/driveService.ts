/**
 * Google Drive API Service Helpers
 * Handles folder search/creation, file listing, uploading, downloading, and deletion.
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Searches for a custom folder or creates it if not present.
 */
export async function getOrCreateFolder(accessToken: string, folderName: string = "Metacognitive Engine Runs"): Promise<string> {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!searchRes.ok) {
    throw new Error(`Folder lookup failed: ${searchRes.statusText}`);
  }
  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  if (!createRes.ok) {
    throw new Error(`Failed to create application folder: ${createRes.statusText}`);
  }
  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Lists all JSON files containing saved traces in the Metacognitive Runs folder.
 */
export async function listSavedRunsInDrive(accessToken: string): Promise<DriveFile[]> {
  try {
    const folderId = await getOrCreateFolder(accessToken);
    const q = `'${folderId}' in parents and trashed = false and mimeType = 'application/json'`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,createdTime,size,webViewLink)&orderBy=createdTime desc`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      throw new Error(`Failed to retrieve file list: ${response.statusText}`);
    }
    const data = await response.json();
    return data.files || [];
  } catch (err: any) {
    console.error("Google Drive list error:", err);
    throw err;
  }
}

/**
 * Saves or updates a JSON metacognitive trace snapshot to the user's Drive folder.
 */
export async function saveFileToDrive(
  accessToken: string, 
  fileName: string, 
  contentObj: any, 
  fileId?: string
): Promise<DriveFile> {
  const folderId = await getOrCreateFolder(accessToken);
  
  const metadata: any = {
    name: fileName,
  };
  
  if (!fileId) {
    metadata.parents = [folderId];
    metadata.mimeType = 'application/json';
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(contentObj, null, 2) +
    close_delim;

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  
  const response = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(`Google Drive save failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Downloads and parses file content from a specific Drive file ID.
 */
export async function downloadFileFromDrive(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Download of file ${fileId} failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Deletes a file from Drive (Note: ALWAYS ask for user confirmation prior to execution).
 */
export async function deleteFileFromDrive(accessToken: string, fileId: string): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Deletion of file ${fileId} failed: ${response.statusText}`);
  }
  return true;
}
