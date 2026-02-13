package config

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/machinebox/progress"
)

func WriteWithProgressBar(dest io.Writer, src io.Reader, ctx context.Context) error {
	size := getLength(src)
	w := progress.NewWriter(dest)
	progressCh := progress.NewTicker(ctx, w, size, time.Second)
	fmt.Printf("Total size: %v\n", size)

	go func() {
		for p := range progressCh {
			if p.Complete() {
				return
			}
			fmt.Printf("Downloaded: %v%%\nRemaining: %v\nEstimated: %v\n, Written: %v\n", p.Percent(), p.Remaining(), p.Estimated(), p.N())
		}
	}()

	return nil
}

func getLength(r io.Reader) int64 {
	size, _ := io.Copy(io.Discard, r)
	return size
}
