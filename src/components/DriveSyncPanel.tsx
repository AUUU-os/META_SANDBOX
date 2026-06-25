import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  FolderOpen, 
  Check, 
  Loader2, 
  LogOut, 
  RefreshCw, 
  FileJson, 
  Save, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebaseAuth';
import { 
  listSavedRunsInDrive, 
  saveFileToDrive, 
  downloadFileFromDrive, 
  deleteFileFromDrive, 
  DriveFile 
} from '../lib/driveService';

interface DriveSyncPanelProps {
  currentAppState: {
    taskPrompt: string;
    selectedDomain: any;
    secondaryDomain: any;
    isComparisonMode: boolean;
    simulationTrace: any;
    secondarySimulationTrace: any;
    selfModel: any;
    memories: any[];
    confidenceThreshold: number;
  };
  onLoadState: (loadedState: any) => void;
}

export function DriveSyncPanel({ currentAppState, onLoadState }: DriveSyncPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  
  // Drive interaction states
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [savingFile, setSavingFile] = useState<boolean>(false);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  
  // Form input
  const [saveFileName, setSaveFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set default save name based on active run
  useEffect(() => {
    const domainName = currentAppState.selectedDomain?.name?.replace(/\s+/g, '-') || 'Run';
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    setSaveFileName(`metacognitive-trace-${domainName}-${dateStr}`);
  }, [currentAppState.selectedDomain]);

  // Load files list once token is active
  useEffect(() => {
    if (token) {
      fetchDriveFiles();
    } else {
      setDriveFiles([]);
    }
  }, [token]);

  const fetchDriveFiles = async () => {
    if (!token) return;
    setLoadingFiles(true);
    setErrorMessage(null);
    try {
      const files = await listSavedRunsInDrive(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load saved files from Google Drive.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setSuccessMessage("Successfully authenticated Google Drive connection!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Authentication failed. Please verify popup permission.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setErrorMessage(null);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      setSuccessMessage("Disconnected from Google Drive.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error signing out.");
    }
  };

  const handleSaveToDrive = async () => {
    if (!token) return;
    if (!saveFileName.trim()) {
      setErrorMessage("Please specify a file name.");
      return;
    }
    setSavingFile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullFileName = saveFileName.endsWith('.json') ? saveFileName : `${saveFileName}.json`;

    try {
      await saveFileToDrive(token, fullFileName, currentAppState);
      setSuccessMessage(`Saved snapshot "${fullFileName}" successfully to Google Drive!`);
      // Reset default file name to prevent accidental double-writes
      const domainName = currentAppState.selectedDomain?.name?.replace(/\s+/g, '-') || 'Run';
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      setSaveFileName(`metacognitive-trace-${domainName}-${dateStr}`);
      
      // Refresh list
      await fetchDriveFiles();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to save workspace file to Google Drive.");
    } finally {
      setSavingFile(false);
    }
  };

  const handleLoadFile = async (file: DriveFile) => {
    if (!token) return;
    setLoadingFileId(file.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const stateObj = await downloadFileFromDrive(token, file.id);
      onLoadState(stateObj);
      setSuccessMessage(`Successfully restored active session from "${file.name}"!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not download or restore session state.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDeleteFile = async (file: DriveFile) => {
    if (!token) return;
    // MANDATORY GUIDELINE: Always request user confirmation before running destructive actions.
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${file.name}" from your Google Drive? This operation cannot be undone.`);
    if (!confirmed) return;

    setDeletingFileId(file.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteFileFromDrive(token, file.id);
      setSuccessMessage(`Deleted file "${file.name}" from Google Drive.`);
      setDriveFiles(prev => prev.filter(f => f.id !== file.id));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to delete the file from Google Drive.");
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden" id="google-drive-sync-panel">
      {/* Decorative accent background blur */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 rounded-xl">
            <Cloud className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Google Drive Sync Hub
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">Backup, load, and version metacognitive simulation snapshots securely.</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-3 py-1.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'user'} className="w-5 h-5 rounded-full border border-zinc-700 referrerPolicy='no-referrer'" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-bold text-cyan-400 flex items-center justify-center">
                {user.displayName?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-bold text-white leading-none">{user.displayName}</p>
              <p className="text-[8px] text-zinc-500 font-medium leading-none mt-0.5">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 transition-colors ml-1 p-1 hover:bg-zinc-800/50 rounded"
              title="Disconnect Google Drive"
              id="drive-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Message banners */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-4 p-3 bg-red-950/30 border border-red-900/40 text-red-400 rounded-xl text-[10px] flex items-start gap-2 font-medium"
            id="drive-error-banner"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-4 p-3 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 rounded-xl text-[10px] flex items-start gap-2 font-medium"
            id="drive-success-banner"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-[10px] text-zinc-500 font-mono">Initializing connection...</span>
        </div>
      ) : !user ? (
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-950/20 border border-cyan-900/20 flex items-center justify-center text-cyan-500">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-xs font-extrabold text-zinc-300">Authorize Workspace Integration</h4>
            <p className="text-[10px] text-zinc-500 leading-normal font-medium">
              Enable full backup capabilities. Authenticate with your Google account to save simulation states and custom memory banks directly into your Drive.
            </p>
          </div>

          {/* Official styled Google Sign In button as specified in skill guidelines */}
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 active:scale-[0.98] transition-all border border-zinc-800 rounded-xl text-xs text-white font-semibold shadow-lg disabled:opacity-50"
            id="drive-login-btn"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Connecting Google Auth...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Save active session */}
          <div className="md:col-span-5 border-r border-zinc-800/50 md:pr-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 bg-cyan-950/40 border border-cyan-900/30 px-2 py-0.5 rounded">
                Backup Active Workspace
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">This saves active task goals, custom learning parameters, memory clusters, and trace comparisons.</p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Snapshot Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={saveFileName}
                    onChange={(e) => setSaveFileName(e.target.value)}
                    placeholder="Enter snapshot name"
                    className="w-full bg-zinc-900 text-[11px] text-white border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 pr-12 outline-none font-medium placeholder-zinc-600 font-mono"
                    id="save-filename-input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold font-mono">.json</span>
                </div>
              </div>

              <button 
                onClick={handleSaveToDrive}
                disabled={savingFile || !saveFileName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black text-[11px] font-bold py-2 rounded-xl active:scale-[0.98] transition-all shadow-md shadow-cyan-950/20 disabled:opacity-50"
                id="save-to-drive-submit"
              >
                {savingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading session...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Commit Snap to Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: List saved versions in Drive */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400 bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                Saved Backups in Google Drive
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
              </span>
              <button 
                onClick={fetchDriveFiles}
                disabled={loadingFiles}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-850 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                title="Refresh File List"
                id="refresh-drive-files-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            <div className="max-h-[170px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {loadingFiles ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-[9px] font-mono text-zinc-600 uppercase">Polling Drive...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-10 border border-dashed border-zinc-800/80 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-zinc-500 font-medium">No saved traces found in Google Drive.</p>
                  <p className="text-[8px] text-zinc-600 font-medium">Commits you save will appear here in the "Metacognitive Engine Runs" folder.</p>
                </div>
              ) : (
                driveFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-800/80 rounded-xl p-2.5 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 text-purple-400 group-hover:text-cyan-400 transition-colors">
                        <FileJson className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors truncate font-mono">
                          {file.name}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-medium mt-0.5">
                          {new Date(file.createdTime).toLocaleString()}
                          {file.size && ` • ${(parseInt(file.size) / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      {file.webViewLink && (
                        <a 
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-lg text-zinc-500 hover:text-cyan-400 transition-colors"
                          title="Open in Google Drive"
                          id={`drive-link-file-${file.id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      
                      <button 
                        onClick={() => handleLoadFile(file)}
                        disabled={loadingFileId !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-950 text-cyan-400 border border-cyan-900/40 rounded-lg text-[10px] font-bold active:scale-[0.97] transition-all disabled:opacity-40"
                        title="Load Snapshot into Workspace"
                        id={`load-file-btn-${file.id}`}
                      >
                        {loadingFileId === file.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <FolderOpen className="w-3 h-3" />
                        )}
                        <span>Restore</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteFile(file)}
                        disabled={deletingFileId !== null}
                        className="p-1.5 bg-zinc-950 hover:bg-red-950/40 text-zinc-600 hover:text-red-400 border border-zinc-900 hover:border-red-900/30 rounded-lg active:scale-[0.97] transition-all"
                        title="Delete from Google Drive"
                        id={`delete-file-btn-${file.id}`}
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
