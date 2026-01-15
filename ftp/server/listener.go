package server

import (
	"net"
	"sync"
)

type trackedListener struct {
	net.Listener
	conns map[net.Conn]struct{}
	mu    sync.Mutex
}

func newTrackedListener(l net.Listener) *trackedListener {
	return &trackedListener{
		Listener: l,
		conns:    make(map[net.Conn]struct{}),
	}
}

func (l *trackedListener) Accept() (net.Conn, error) {
	c, err := l.Listener.Accept()
	if err != nil {
		return nil, err
	}

	l.mu.Lock()
	l.conns[c] = struct{}{}
	l.mu.Unlock()

	return &trackedConn{Conn: c, parent: l}, nil
}

func (l *trackedListener) closeAll() {
	l.mu.Lock()
	defer l.mu.Unlock()

	for c := range l.conns {
		_ = c.Close()
		delete(l.conns, c)
	}
}

type trackedConn struct {
	net.Conn
	parent *trackedListener
}

func (c *trackedConn) Close() error {
	c.parent.mu.Lock()
	delete(c.parent.conns, c.Conn)
	c.parent.mu.Unlock()
	return c.Conn.Close()
}
