package main

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/server"
	"github.com/jlaffaye/ftp"
)

func handleStartFTP(w http.ResponseWriter, req *http.Request) {
	port := req.FormValue("port")
	path := req.FormValue("root")
	if port != "" {
		ftpPort = port
	}
	if path != "" {
		if !folderExists(path) {
			http.Error(w, fmt.Sprintf("\"%v\" folder does not exist", path), http.StatusBadRequest)
			return
		}

		svrRootDir = filepath.Join(homeDir, path)
	}

	err := server.StartFTP(port, svrRootDir)
	if err != nil {
		logsCh <- fmt.Sprintf("Error occured while starting ftp: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}

func handleStopFTP(w http.ResponseWriter, req *http.Request) {
	server.StopFTP()
	w.WriteHeader(http.StatusNoContent)
}

func handleGetConnectedClients(w http.ResponseWriter, req *http.Request) {
	connClients := server.GetConnectedHosts()
	sendJSON(w, connClients)
}

func handleStreamFile(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	path := req.URL.Query().Get("path")
	if path == "" {
		err := fmt.Errorf("path is required")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	entry, err := c.GetEntry(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if entry.Type != ftp.EntryTypeFile {
		err := fmt.Errorf("Error: \"%v\" is not a file", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response, err := c.Retr(path)
	if err != nil {
		//Clarify error msg if file not found
		if strings.Contains(strings.ToLower(err.Error()), "file not found") || strings.Contains(err.Error(), "550") { // 550 is the FTP code for not found
			http.Error(w, "Error: The requested file does not exist.", http.StatusNotFound)
		} else {
			http.Error(w, "Server Error: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}
	defer response.Close()

	//Set headers for file download
	mode := req.URL.Query().Get("mode")
	fileName := filepath.Base(path)
	contentType := getContentType(fileName)
	if mode == "stream" {
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%v\"", fileName))
		w.Header().Set("Content-Type", contentType)
	}
	if mode == "download" {
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.Header().Set("Content-Length", strconv.Itoa(int(entry.Size)))

	_, err = io.Copy(w, response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- err.Error()
	}
}

func handleListDir(w http.ResponseWriter, req *http.Request) {
	c, err := client.GetClient()
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	//Get entry at path
	path := req.URL.Query().Get("path")
	entry, err := c.GetEntry(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- fmt.Sprintf("Error occured while reading \"%v\": %v", path, err)
		return
	}

	//Check if not folder
	if entry.Type != ftp.EntryTypeFolder {
		err := fmt.Errorf("Error: \"%v\" is not a directory", path)
		http.Error(w, err.Error(), http.StatusBadRequest)
		logsCh <- err.Error()
		return
	}

	//List directory
	entries, err := c.List(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		logsCh <- err.Error()
		return
	}

	//Store and send in json
	directory := Dir{Entries: []FSObject{}} //Initialize to avoid null in json
	for _, entry := range entries {
		e := FSObject{
			Name: entry.Name,
		}
		if entry.Type == ftp.EntryTypeFolder {
			e.IsFolder = true
		} else {
			e.IsFolder = false
		}

		directory.Entries = append(directory.Entries, e)
	}

	sendJSON(w, directory)
}
