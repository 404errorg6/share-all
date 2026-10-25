package clienthandlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/404errorg6/share-all/internal/config"

	"github.com/jlaffaye/ftp"
	"github.com/machinebox/progress"
	"github.com/wailsapp/wails/v3/pkg/application"
)

func GetNewConn() (*ftp.ServerConn, error) {
	c, err := ftp.Dial(verifiedAddr, ftp.DialWithTimeout(5*time.Second))
	if err != nil {
		return nil, err
	}

	err = c.Login(verifiedUser, verifiedPass)
	if err != nil {
		return nil, err
	}

	return c, nil
}

func startTracking(name string, size int64, isDownload bool, progressCh <-chan progress.Progress) {
	app := application.Get()
	info := config.TransferInfo{
		TotalSize:  size,
		Name:       name,
		IsDownload: isDownload,
	}

	sendMetaDataToServer(name, info)

	if isDownload {
		config.LogsCh <- fmt.Sprintf("Downloading %v...", name)
	} else {
		config.LogsCh <- fmt.Sprintf("Uploading %v...", name)
	}

	for p := range progressCh {
		info.Percent = p.Percent()
		info.Written = p.N()
		app.Event.Emit("transfers:ongoing", info)
		transferMap.Store(name, info)
	}

	info.IsComplete = true
	app.Event.Emit("transfers:completed", info)
	transferMap.Delete(name)
	config.LogsCh <- fmt.Sprintf("Completed \"%v\"!", name)
}

func sendMetaDataToServer(name string, info config.TransferInfo) {
	info.IsDownload = !info.IsDownload

	c, err := GetNewConn()
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error sending metadata to server: %v", err)
	} else {
		metafile := fmt.Sprintf("%v.meta", name)
		metaBytes, err := json.Marshal(info)

		if err != nil {
			config.LogsCh <- fmt.Sprintf("Error sending metadata to server: %v", err)
		} else {

			metaBuffer := bytes.NewBuffer(metaBytes)
			err := c.Stor(metafile, metaBuffer)

			if err != nil {
				config.LogsCh <- fmt.Sprintf("Error sending metadata to server: %v", err)
			}
		}
	}
}
