package filedriver

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/goftp/server"
)

type FileDriver struct {
	RootPath string
	server.Perm
}

type FileInfo struct {
	os.FileInfo
	mode  os.FileMode
	owner string
	group string
}

func (f *FileInfo) Mode() os.FileMode { return f.mode }
func (f *FileInfo) Owner() string     { return f.owner }
func (f *FileInfo) Group() string     { return f.group }

// Edit this function to change how permissions/owners are handled.
func (driver *FileDriver) getMetadata(info os.FileInfo) *FileInfo {
	// Default permissions (Read/Write for everyone)
	mode := os.FileMode(0666)

	if info.IsDir() {
		mode |= os.ModeDir | 0111 // Add Directory bit and Execute bit
	}

	owner := "u0_a0"
	group := "android"

	return &FileInfo{
		FileInfo: info,
		mode:     mode,
		owner:    owner,
		group:    group,
	}
}

func (driver *FileDriver) realPath(path string) string {
	paths := strings.Split(path, "/")
	return filepath.Join(append([]string{driver.RootPath}, paths...)...)
}

func (driver *FileDriver) Init(conn *server.Conn) {}

func (driver *FileDriver) ChangeDir(path string) error {
	rPath := driver.realPath(path)
	f, err := os.Lstat(rPath)
	if err != nil {
		return err
	}
	if f.IsDir() {
		return nil
	}
	return errors.New("not a directory")
}

func (driver *FileDriver) Stat(path string) (server.FileInfo, error) {
	basepath := driver.realPath(path)
	rPath, err := filepath.Abs(basepath)
	if err != nil {
		return nil, err
	}
	f, err := os.Lstat(rPath)
	if err != nil {
		return nil, err
	}

	// Call centralized metadata logic
	return driver.getMetadata(f), nil
}

func (driver *FileDriver) ListDir(path string, callback func(server.FileInfo) error) error {
	basepath := driver.realPath(path)
	entries, err := os.ReadDir(basepath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Call centralized metadata logic
		err = callback(driver.getMetadata(info))
		if err != nil {
			return err
		}
	}
	return nil
}

func (driver *FileDriver) DeleteDir(path string) error {
	rPath := driver.realPath(path)
	return os.Remove(rPath)
}

func (driver *FileDriver) DeleteFile(path string) error {
	rPath := driver.realPath(path)
	return os.Remove(rPath)
}

func (driver *FileDriver) Rename(fromPath string, toPath string) error {
	return os.Rename(driver.realPath(fromPath), driver.realPath(toPath))
}

func (driver *FileDriver) MakeDir(path string) error {
	return os.MkdirAll(driver.realPath(path), os.ModePerm)
}

func (driver *FileDriver) GetFile(path string, offset int64) (int64, io.ReadCloser, error) {
	rPath := driver.realPath(path)
	f, err := os.Open(rPath)
	if err != nil {
		return 0, nil, err
	}

	info, err := f.Stat()
	if err != nil {
		f.Close()
		return 0, nil, err
	}

	f.Seek(offset, io.SeekStart)
	return info.Size(), f, nil
}

func (driver *FileDriver) PutFile(destPath string, data io.Reader, appendData bool) (int64, error) {
	rPath := driver.realPath(destPath)

	// Check if exists
	info, err := os.Lstat(rPath)
	isExist := err == nil

	if isExist && info.IsDir() {
		return 0, errors.New("a directory exists with this name")
	}

	var f *os.File
	if appendData && isExist {
		f, err = os.OpenFile(rPath, os.O_APPEND|os.O_RDWR, 0666)
	} else {
		f, err = os.Create(rPath)
	}

	if err != nil {
		return 0, err
	}
	defer f.Close()

	return io.Copy(f, data)
}

type FileDriverFactory struct {
	RootPath string
	server.Perm
}

func (factory *FileDriverFactory) NewDriver() (server.Driver, error) {
	return &FileDriver{factory.RootPath, factory.Perm}, nil
}

