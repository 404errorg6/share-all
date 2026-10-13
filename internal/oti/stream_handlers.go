package oti

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/libp2p/go-libp2p/core/network"
)

var buffSize = 1024

func HandlerLS(s network.Stream) { //Dir info sent to the client
	defer s.Close()

	buf := make([]byte, buffSize)
	n, err := s.Read(buf)
	if err != nil {
		config.LogsCh <- "Error reading the buffer: " + err.Error()
		return
	}

	path := config.ResolveLocalPath(string(buf[:n]))
	entry, err := os.Lstat(path)
	if err != nil {
		config.DisplayError(err, "")
		return
	}

	if !entry.IsDir() {
		config.LogsCh <- fmt.Sprintf("The path is not a directory: \"%v\"", path)
		return
	}

	entries, err := os.ReadDir(path)
	if err != nil {
		config.LogsCh <- "Error reading directory: " + err.Error()
		return
	}

	FSObjectArr := []config.FSObject{}

	for _, entry := range entries {
		newEntry := config.FSObject{}

		info, err := entry.Info()
		if err != nil {
			config.DisplayError(err, "")
			return
		}

		newEntry.IsFolder = info.IsDir()
		newEntry.Name = info.Name()
		newEntry.Size = int(info.Size())
		newEntry.LastModified = info.ModTime()
		FSObjectArr = append(FSObjectArr, newEntry)
	}

	FSObjJson, err := json.Marshal(FSObjectArr)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error marshalling data: %v", err)
		return
	}

	s.Write(FSObjJson)
}

func HandlerFT(s network.Stream) {
	defer s.Close()

	buf := make([]byte, buffSize)
	n, err := s.Read(buf)
	if err != nil {
		config.LogsCh <- "Error reading buffer: " + err.Error()
		return
	}

	path := config.ResolveLocalPath(string(buf[:n]))
	info, err := os.Lstat(path)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error lstat-ing path \"%v\": %v", path, err)
		return
	}

	if info.IsDir() {
		config.LogsCh <- "The path is not a file: " + "\"" + path + "\""
		return
	}

	file, err := os.Open(path)
	if err != nil {
		config.LogsCh <- "Error opening file at " + path + ": " + err.Error()
		return
	}
	defer file.Close()

	_, err = io.Copy(s, file)
	if err != nil {
		config.LogsCh <- "Error sending file: " + err.Error()
		return
	}

	config.LogsCh <- fmt.Sprintf("Transferred %v successfully!", filepath.Base(path))
}
