package server

import (
	"fmt"
	"os"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/spf13/afero"
)

type AndroidClientDriver struct {
	afero.Fs
}

func (d *AndroidClientDriver) GetFs() afero.Fs {
	return d.Fs
}

// Show progress for client-downloads
func (d *AndroidClientDriver) Open(name string) (afero.File, error) {
	file, err := d.Fs.Open(name)
	if err != nil {
		return file, err
	}

	fileInfo, err := file.Stat()
	if err != nil {
		return file, err
	}

	if fileInfo.IsDir() {
		return file, nil
	}

	clientTransferInfo := config.TransferInfo{
		Name:       fileInfo.Name(),
		TotalSize:  fileInfo.Size(),
		IsDownload: false, //client download is server upload
	}

	return wrapWithReadProgress(file, clientTransferInfo), nil
}

// Catch uploads that use OpenFile instead of Create
func (d *AndroidClientDriver) OpenFile(name string, flag int, perm os.FileMode) (afero.File, error) {
	// If the file is being opened for writing or appending, treat it as an upload
	if flag&os.O_WRONLY != 0 || flag&os.O_RDWR != 0 || flag&os.O_CREATE != 0 {
		return d.Create(name)
	}

	// Otherwise, treat it as a normal read/download
	return d.Open(name)
}

// Show progress for client-uploads
func (d *AndroidClientDriver) Create(name string) (afero.File, error) {
	var clientTransferInfo config.TransferInfo

	actualName, clientTransferInfo, err := config.DecodeNameWithHeaders(name)
	if err != nil {
		config.LogsCh <- fmt.Sprintf("Error while decoding name: %v", err)
		clientTransferInfo.IsDownload = true //client upload is server download
		clientTransferInfo.Name = "Error occured"
		clientTransferInfo.TotalSize = 0
	}

	realFile, err := d.Fs.Create(actualName)
	if err != nil {
		return nil, err
	}

	return wrapWithWriteProgress(realFile, clientTransferInfo, actualName), nil
}
