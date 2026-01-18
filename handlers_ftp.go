package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

type Dir struct {
	Entries []FSObject
}

type FSObject struct {
	Name  string
	IsDir bool
}

func handleFile(w http.ResponseWriter, req *http.Request) {
	http.Error(w, "Not implemented yet", http.StatusNotImplemented)
}

func handleLS(w http.ResponseWriter, req *http.Request) {
	basePath := req.URL.Query().Get("path")
	path := filepath.Join(root, basePath)
	entry, err := os.Lstat(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- fmt.Sprintf("Error occured while reading \"%v\": %v", path, err)
		return
	}

	if !entry.IsDir() {
		err := fmt.Errorf("Error: \"%v\" is not a directory", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	entries, err := os.ReadDir(path)
	directory := Dir{}
	for _, entry := range entries {
		e := FSObject{
			Name: entry.Name(),
		}
		if entry.IsDir() {
			e.IsDir = true
		}

		if entry.Type().IsRegular() {
			e.IsDir = false
		}

		directory.Entries = append(directory.Entries, e)
	}

	sendJSON(w, directory)
}
