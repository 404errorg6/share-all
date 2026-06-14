package p2phandlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/google/uuid"
)

type writeSession struct {
	ID       string
	File     *os.File
	TempPath string
	DestPath string
	Mode     string
}

var writeSessions sync.Map

func resolveModePath(mode, rawPath string) (string, error) {
	switch strings.ToLower(mode) {
	case "shared":
		return config.P2PShare.ResolveSharedPath(rawPath)
	case "local", "":
		return config.ResolveLocalPath(rawPath), nil
	default:
		return "", fmt.Errorf("unsupported mode: %s", mode)
	}
}

func canWriteMode(mode string) bool {
	if strings.EqualFold(mode, "shared") {
		return config.P2PShare.CanWrite()
	}
	return true
}

func HandleListFS(w http.ResponseWriter, req *http.Request) {
	mode := req.URL.Query().Get("mode")
	rawPath := req.URL.Query().Get("path")
	fullPath, err := resolveModePath(mode, rawPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result := make([]config.FSObject, 0, len(entries))
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		result = append(result, config.FSObject{
			Name:         entry.Name(),
			IsFolder:     entry.IsDir(),
			LastModified: info.ModTime(),
			Size:         int(info.Size()),
		})
	}

	config.SendJSON(w, result)
}

func HandleReadFile(w http.ResponseWriter, req *http.Request) {
	mode := req.URL.Query().Get("mode")
	rawPath := req.URL.Query().Get("path")
	fullPath, err := resolveModePath(mode, rawPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	if info.IsDir() {
		http.Error(w, "cannot read a directory", http.StatusBadRequest)
		return
	}

	http.ServeFile(w, req, fullPath)
}

func HandleMkdir(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mode := req.FormValue("mode")
	if !canWriteMode(mode) {
		http.Error(w, "writing is disabled for this share", http.StatusForbidden)
		return
	}

	rawPath := req.FormValue("path")
	fullPath, err := resolveModePath(mode, rawPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := os.MkdirAll(fullPath, 0o755); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleWriteStart(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mode := req.FormValue("mode")
	if !canWriteMode(mode) {
		http.Error(w, "writing is disabled for this share", http.StatusForbidden)
		return
	}

	rawPath := req.FormValue("path")
	fullPath, err := resolveModePath(mode, rawPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id := uuid.NewString()
	tempPath := fullPath + ".share-all-part-" + id
	file, err := os.Create(tempPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeSessions.Store(id, &writeSession{
		ID:       id,
		File:     file,
		TempPath: tempPath,
		DestPath: fullPath,
		Mode:     mode,
	})

	config.SendJSON(w, map[string]string{"uploadId": id})
}

func HandleWriteChunk(w http.ResponseWriter, req *http.Request) {
	id := req.URL.Query().Get("upload_id")
	if id == "" {
		http.Error(w, "upload_id is required", http.StatusBadRequest)
		return
	}

	value, ok := writeSessions.Load(id)
	if !ok {
		http.Error(w, "upload session not found", http.StatusNotFound)
		return
	}
	session := value.(*writeSession)

	_, err := io.Copy(session.File, req.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandleWriteFinish(w http.ResponseWriter, req *http.Request) {
	id := req.URL.Query().Get("upload_id")
	if id == "" {
		http.Error(w, "upload_id is required", http.StatusBadRequest)
		return
	}

	value, ok := writeSessions.Load(id)
	if !ok {
		http.Error(w, "upload session not found", http.StatusNotFound)
		return
	}
	writeSessions.Delete(id)
	session := value.(*writeSession)

	if err := session.File.Close(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := os.Remove(session.DestPath); err != nil && !os.IsNotExist(err) {
		_ = os.Remove(session.TempPath)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := os.Rename(session.TempPath, session.DestPath); err != nil {
		_ = os.Remove(session.TempPath)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
