package oti

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/libp2p/go-libp2p/core/network"
)

func HandlerLS(s network.Stream) { //Dir info sent to the client
	defer s.Close()

	buf, err := io.ReadAll(s)
	if err != nil {
		config.LogsCh <- "Error reading the buffer: " + err.Error()
		return
	}

	path := config.ResolveLocalPath(string(buf))
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

func HandlerFileTransfer(s network.Stream) { //Handles client's file transfer requests
	defer s.Close()
	var header Header

	headerBytes, err := bufio.NewReader(s).ReadString(byte('\n'))
	if err != nil {
		config.LogsCh <- "Error reading headerBytes: " + err.Error()
		return
	}

	err = json.Unmarshal([]byte(headerBytes), &header)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error unmarshalling data: %v", err)
		return
	}

	path := config.ResolveLocalPath(header.Path)
	if header.TransferType == FromServerToClient {
		SendFromServerToClient(s, path)
	} else {
		SendFromClientToServer(s, path, header.ClientFileName)
	}
}

func SendFromServerToClient(s network.Stream, path string) {
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

	config.LogsCh <- fmt.Sprintf("Sent %v successfully!", filepath.Base(path))
}

func SendFromClientToServer(s network.Stream, path, fileName string) {
	defer s.Close()

	path = config.ResolveLocalPath(path)
	info, err := os.Lstat(path)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error ls-stating \"%v\": %v", path, err)
		return
	}

	if !info.IsDir() {
		config.LogsCh <- fmt.Sprintf("\"%v\" is not a directory", path)
		return
	}

	filePath := filepath.Join(path, fileName)
	file, err := os.Create(filePath)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error creating file at \"%v\": %v", filePath, err)
		return
	}
	defer file.Close()

	_, err = io.Copy(file, s)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error copying file to \"%v\": %v", filePath, err)
		return
	}

	config.LogsCh <- fmt.Sprintf("Successfully received \"%v\"", filePath)
}
