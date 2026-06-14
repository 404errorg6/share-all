package config

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
)

type P2PShareState struct {
	mu           sync.RWMutex
	Name         string
	RootDir      string
	WriteAllowed bool
	Configured   bool
}

type P2PShareInfo struct {
	Name         string `json:"name"`
	RootDir      string `json:"rootDir"`
	WriteAllowed bool   `json:"writeAllowed"`
	Configured   bool   `json:"configured"`
}

var P2PShare = &P2PShareState{
	Name:         DefFTPServerName,
	RootDir:      DefLocalDir,
	WriteAllowed: true,
	Configured:   false,
}

func (s *P2PShareState) Configure(name, rootDir string, writeAllowed bool) error {
	rootDir = ResolveLocalPath(rootDir)
	if !LocalFolderExists(rootDir) {
		return fmt.Errorf("\"%v\" folder does not exist", rootDir)
	}

	if strings.TrimSpace(name) == "" {
		name = DefFTPServerName
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.Name = name
	s.RootDir = rootDir
	s.WriteAllowed = writeAllowed
	s.Configured = true
	return nil
}

func (s *P2PShareState) Snapshot() P2PShareInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return P2PShareInfo{
		Name:         s.Name,
		RootDir:      s.RootDir,
		WriteAllowed: s.WriteAllowed,
		Configured:   s.Configured,
	}
}

func (s *P2PShareState) ensureConfigured() error {
	s.mu.RLock()
	configured := s.Configured
	rootDir := s.RootDir
	s.mu.RUnlock()

	if configured {
		return nil
	}

	return s.Configure(DefFTPServerName, rootDir, true)
}

func (s *P2PShareState) ResolveSharedPath(rel string) (string, error) {
	if err := s.ensureConfigured(); err != nil {
		return "", err
	}

	s.mu.RLock()
	rootDir := s.RootDir
	s.mu.RUnlock()

	if rel == "" || rel == "." || rel == "/" {
		return filepath.Clean(rootDir), nil
	}

	cleanRel := path.Clean(filepath.ToSlash(rel))
	if cleanRel == "." || cleanRel == "/" {
		return filepath.Clean(rootDir), nil
	}
	if strings.HasPrefix(cleanRel, "../") || cleanRel == ".." {
		return "", fmt.Errorf("path escapes the shared root")
	}

	fullPath := filepath.Clean(filepath.Join(rootDir, filepath.FromSlash(cleanRel)))
	relToRoot, err := filepath.Rel(rootDir, fullPath)
	if err != nil {
		return "", err
	}
	if relToRoot == ".." || strings.HasPrefix(relToRoot, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("path escapes the shared root")
	}

	return fullPath, nil
}

func (s *P2PShareState) SharedRelativePath(fullPath string) (string, error) {
	if err := s.ensureConfigured(); err != nil {
		return "", err
	}

	s.mu.RLock()
	rootDir := s.RootDir
	s.mu.RUnlock()

	rel, err := filepath.Rel(rootDir, fullPath)
	if err != nil {
		return "", err
	}
	if rel == "." {
		return ".", nil
	}
	return filepath.ToSlash(rel), nil
}

func (s *P2PShareState) CanWrite() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.WriteAllowed
}

func SharedDirEntries(rel string) ([]FSObject, error) {
	fullPath, err := P2PShare.ResolveSharedPath(rel)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	result := make([]FSObject, 0, len(entries))
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}

		result = append(result, FSObject{
			Name:         entry.Name(),
			IsFolder:     entry.IsDir(),
			LastModified: info.ModTime(),
			Size:         int(info.Size()),
		})
	}

	return result, nil
}
