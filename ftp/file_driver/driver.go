package filedriver

import (
	"errors"
	"fmt"
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

// FileInfo wraps os.FileInfo to provide the methods required by goftp
type FileInfo struct {
	os.FileInfo

	mode  os.FileMode
	owner string
	group string
}

func (f *FileInfo) Mode() os.FileMode {
	return f.mode
}

func (f *FileInfo) Owner() string {
	return f.owner
}

func (f *FileInfo) Group() string {
	return f.group
}

func (driver *FileDriver) realPath(path string) string {
	paths := strings.Split(path, "/")
	return filepath.Join(append([]string{driver.RootPath}, paths...)...)
}

func (driver *FileDriver) Init(conn *server.Conn) {
	// driver.conn = conn
}

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

	// ANDROID SPECIFIC:
	// We allow full read/write permissions (0666) visually to the client.
	// Actual enforcement is done by the Android OS layer.
	mode := os.FileMode(0666)
	if f.IsDir() {
		mode |= os.ModeDir
		mode |= os.FileMode(0777) // Dirs need execute permission to be entered
	}

	// Android doesn't have standard linux users in a way Go can easily query
	// without CGO. We hardcode generic names to satisfy the FTP protocol.
	owner := "u0_a0"
	group := "android"

	return &FileInfo{
		FileInfo: f,
		mode:     mode,
		owner:    owner,
		group:    group,
	}, nil
}

func (driver *FileDriver) ListDir(path string, callback func(server.FileInfo) error) error {
	basepath := driver.realPath(path)

	// ReadDir is better than Walk for flat directory listing
	entries, err := os.ReadDir(basepath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Mock Permissions for Android
		mode := info.Mode()
		// Ensure generic R/W is visible to client
		if info.IsDir() {
			mode |= os.ModeDir
		}

		owner := "u0_a0"
		group := "android"

		err = callback(&FileInfo{
			FileInfo: info,
			mode:     mode,
			owner:    owner,
			group:    group,
		})

		if err != nil {
			return err
		}
	}
	return nil
}

func (driver *FileDriver) DeleteDir(path string) error {
	rPath := driver.realPath(path)
	f, err := os.Lstat(rPath)
	if err != nil {
		return err
	}
	if f.IsDir() {
		return os.Remove(rPath)
	}
	return errors.New("not a directory")
}

func (driver *FileDriver) DeleteFile(path string) error {
	rPath := driver.realPath(path)
	f, err := os.Lstat(rPath)
	if err != nil {
		return err
	}
	if !f.IsDir() {
		return os.Remove(rPath)
	}
	return errors.New("not a file")
}

func (driver *FileDriver) Rename(fromPath string, toPath string) error {
	oldPath := driver.realPath(fromPath)
	newPath := driver.realPath(toPath)
	return os.Rename(oldPath, newPath)
}

func (driver *FileDriver) MakeDir(path string) error {
	rPath := driver.realPath(path)
	return os.MkdirAll(rPath, os.ModePerm)
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

	_, err = f.Seek(offset, io.SeekStart)
	if err != nil {
		f.Close()
		return 0, nil, err
	}

	return info.Size(), f, nil
}

func (driver *FileDriver) PutFile(destPath string, data io.Reader, appendData bool) (int64, error) {
	rPath := driver.realPath(destPath)
	var isExist bool
	f, err := os.Lstat(rPath)
	if err == nil {
		isExist = true
		if f.IsDir() {
			return 0, errors.New("a dir has the same name")
		}
	} else {
		if os.IsNotExist(err) {
			isExist = false
		} else {
			return 0, fmt.Errorf("put file error: %v", err)
		}
	}

	if appendData && !isExist {
		appendData = false
	}

	if !appendData {
		if isExist {
			err = os.Remove(rPath)
			if err != nil {
				return 0, err
			}
		}
		f, err := os.Create(rPath)
		if err != nil {
			return 0, err
		}
		defer f.Close()
		bytes, err := io.Copy(f, data)
		if err != nil {
			return 0, err
		}
		return bytes, nil
	}

	of, err := os.OpenFile(rPath, os.O_APPEND|os.O_RDWR, 0660)
	if err != nil {
		return 0, err
	}
	defer of.Close()

	_, err = of.Seek(0, io.SeekEnd)
	if err != nil {
		return 0, err
	}

	bytes, err := io.Copy(of, data)
	if err != nil {
		return 0, err
	}

	return bytes, nil
}

type FileDriverFactory struct {
	RootPath string
	server.Perm
}

func (factory *FileDriverFactory) NewDriver() (server.Driver, error) {
	return &FileDriver{factory.RootPath, factory.Perm}, nil
}
