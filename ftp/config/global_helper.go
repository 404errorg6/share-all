package config

import (
	"encoding/json"
	"fmt"
	"mime"
	"net"
	"net/http"
	"net/netip"
	"os"
	"path"
	"path/filepath"

	"github.com/jlaffaye/ftp"
)

func ResolveRemotePath(c *ftp.ServerConn, remotePath string) (string, *ftp.Entry, error) {
	if remotePath == "" {
		return ".", nil, nil
	}

	remotePath = filepath.ToSlash(remotePath)

	//Check if file/folder is within accessible range
	entry, err := c.GetEntry(remotePath) //Get from client's accessible filesystem
	if err != nil {
		return "", nil, err
	}

	//File/folder is safe to send now
	if !isAbsPath(remotePath) {
		remotePath = path.Join(FTPServer.RootDir, remotePath)
	}

	remotePath = path.Clean(remotePath)
	return remotePath, entry, nil
}

func ResolveLocalPath(localPath string) string {
	localPath = filepath.ToSlash(localPath)
	if localPath == "" {
		return DefLocalDir
	}

	if isAbsPath(localPath) {
		return filepath.Clean(localPath)
	}

	return filepath.Join(DefLocalDir, localPath)
}

func GetHostPort(addr string) (string, string, error) {
	return net.SplitHostPort(addr)
}

func ConvertIfaceToAddr(iface net.Interface) (netip.Addr, bool) {
	addrs, _ := iface.Addrs()
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			// Ensure it's IPv4 for this example
			if ip4 := ipNet.IP.To4(); ip4 != nil {
				finalAddr, ok := netip.AddrFromSlice(ip4)
				if ok {
					return finalAddr, true
				}
			}
		}
	}

	return netip.Addr{}, false
}

/*
	func GetHostPort(addr string) (string, string, error) {
		host, port, found := strings.Cut(addr, ":")
		if !found {
			err := fmt.Errorf("[INFO]: \":\" not found. Using \"%v\" as host", addr)
			LogsCh <- err.Error()
			return addr, "", err
		}
		return host, port, nil
	}
*/
func SendJSON(w http.ResponseWriter, data any) {
	body, err := json.Marshal(data)
	if err != nil {
		LogsCh <- fmt.Sprintf("Error sending JSON: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(body))
}

func RemoteFolderExists(remotePath string, c *ftp.ServerConn) bool {
	info, err := c.GetEntry(remotePath)
	if err != nil {
		return false
	}

	if info.Type == ftp.EntryTypeFolder {
		return true
	}

	return false
}

func LocalFolderExists(localPath string) bool {
	info, err := os.Stat(localPath)
	if err != nil {
		if os.IsExist(err) {
			return true
		}

		LogsCh <- err.Error()
		return false
	}

	return info.IsDir()
}

func GetContentType(fileName string) string {
	ext := filepath.Ext(fileName)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return "application/octet-stream"
	}

	return contentType
}
