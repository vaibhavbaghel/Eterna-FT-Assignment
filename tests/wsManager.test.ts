import WebSocket from 'ws';
import { wsManager } from '../src/wsManager';

describe('WSManager', () => {
  test('register and send use in-memory socket', () => {
    const fakeSocket = {
      readyState: WebSocket.OPEN,
      send: jest.fn(),
    } as any;
    wsManager.register('test-order', fakeSocket);
    wsManager.send('test-order', { status: 'pending' });
    expect((fakeSocket.send as jest.Mock).mock.calls.length).toBe(1);
    wsManager.unregister('test-order');
  });
});
