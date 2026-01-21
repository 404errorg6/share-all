package serverhandlers

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/404errorg6/FTP-server/ftp/client"
	"github.com/404errorg6/FTP-server/ftp/config"
	"github.com/jlaffaye/ftp"
)

func HandleStreamFile(w http.ResponseWriter, req *http.Request) {
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
	contentType := config.GetContentType(fileName)
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
		config.LogsCh <- err.Error()
	}
}
