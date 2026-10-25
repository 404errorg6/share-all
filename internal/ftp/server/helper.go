package server

import (
	"context"
	"fmt"
	"time"

	"github.com/404errorg6/share-all/internal/config"
	"github.com/machinebox/progress"
	"github.com/spf13/afero"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type progressWriterFile struct {
	afero.File
	pw *progress.Writer
}

func (pwf *progressWriterFile) Write(p []byte) (int, error) {
	return pwf.pw.Write(p)
}

type progressReaderFile struct {
	afero.File
	pr *progress.Reader
}

func (prf *progressReaderFile) Read(p []byte) (int, error) {
	return prf.pr.Read(p)
}

// For client downloads
func wrapWithReadProgress(file afero.File, clientTransferInfo config.TransferInfo) afero.File {
	config.LogsCh <- fmt.Sprintf("%v is being uploaded...", clientTransferInfo.Name)

	app := application.Get()
	pr := progress.NewReader(file)

	go func() {
		ticker := progress.NewTicker(context.Background(), pr, clientTransferInfo.TotalSize, time.Second)

		for p := range ticker {
			clientTransferInfo.Percent = p.Percent()
			clientTransferInfo.Written = p.N()
			app.Event.Emit("transfers:ongoing", clientTransferInfo)
		}

		clientTransferInfo.IsComplete = true
		app.Event.Emit("transfers:completed", clientTransferInfo)
	}()

	return &progressReaderFile{
		File: file,
		pr:   pr,
	}
}

// For client uploads
func wrapWithWriteProgress(file afero.File, clientTransferInfo config.TransferInfo, name string) afero.File {
	config.LogsCh <- fmt.Sprintf("%v is being uploaded...", clientTransferInfo.Name)

	if clientTransferInfo.TotalSize == 0 {
		return file
	}

	app := application.Get()
	pw := progress.NewWriter(file)

	go func() {
		ticker := progress.NewTicker(context.Background(), pw, clientTransferInfo.TotalSize, time.Second)

		for p := range ticker {
			clientTransferInfo.Percent = p.Percent()
			clientTransferInfo.Written = p.N()
			app.Event.Emit("transfers:ongoing", clientTransferInfo)
		}

		clientTransferInfo.IsComplete = true
		app.Event.Emit("transfers:completed", clientTransferInfo)
	}()

	return &progressWriterFile{
		File: file,
		pw:   pw,
	}
}
