import unittest
from unittest.mock import patch, MagicMock
import mcp_server


class MCPServerTestCase(unittest.TestCase):
    @patch('urllib.request.urlopen')
    def test_list_bounties_handler(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"status": "ok", "open_queries": [{"id": 1, "title": "Audit io_uring"}]}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = mcp_server.handle_list_bounties()
        self.assertIn('queries', res)
        self.assertEqual(len(res['queries']), 1)
        self.assertEqual(res['queries'][0]['title'], 'Audit io_uring')

    @patch('urllib.request.urlopen')
    def test_test_patch_handler(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"status": "ok", "passed": true, "exit_code": 0, "stdout": "All tests passed"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = mcp_server.handle_test_patch(bounty_id=1, patch="diff --git a/file.py")
        self.assertTrue(res['passed'])
        self.assertEqual(res['exit_code'], 0)


if __name__ == '__main__':
    unittest.main()
