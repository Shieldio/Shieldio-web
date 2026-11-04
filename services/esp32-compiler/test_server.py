import base64
from pathlib import Path
import unittest
import server


class CompilerTests(unittest.TestCase):
    def test_rejects_untrusted_flags_and_oversized_source(self):
        for board in ["esp32; curl attacker", "esp32:esp32:esp32", "esp32c2", {}, None]:
            with self.assertRaises(server.BuildError):
                server.validate({"protocol":server.PROTOCOL, "board":board, "source":"code"})
        for code in ["", "\x00", "a"*200001, "ž"*100001, None]:
            with self.assertRaises(server.BuildError):
                server.validate({"protocol":server.PROTOCOL, "board":"esp32", "source":code})

    def test_each_board_is_isolated_and_temporary_files_are_removed(self):
        for board in server.BOARDS:
            paths, cleanups = [], []
            def run(command):
                mount = command[command.index("--mount")+1]
                folder = Path(mount.split("src=",1)[1].split(",dst=",1)[0])
                paths.append(folder)
                self.assertEqual((folder/"sketch/sketch.ino").read_text(),"source")
                self.assertEqual(command[command.index("--network")+1],"none")
                self.assertEqual(command[command.index("--user")+1],"65534:65534")
                self.assertEqual(command[command.index("--fqbn")+1],"esp32:esp32:"+server.BOARDS[board])
                self.assertIn("--read-only",command)
                (folder/"output/sketch.ino.merged.bin").write_bytes(b"firmware")
                return 0, "compiled"
            result = server.build({"protocol":server.PROTOCOL,"board":board,"source":"source"},run,cleanups.append)
            self.assertEqual(result["board"],board)
            self.assertEqual(base64.b64decode(result["image"]),b"firmware")
            self.assertEqual(cleanups,[paths[0].name])
            self.assertFalse(paths[0].exists())

    def test_failure_never_returns_a_binary(self):
        cleaned = []
        with self.assertRaises(server.BuildError) as caught:
            server.build({"protocol":server.PROTOCOL,"board":"esp32s3","source":"broken"},lambda args:(1,"sketch.ino:2:1: error: expected ;"),cleaned.append)
        self.assertEqual(str(caught.exception),"COMPILE_ERROR")
        self.assertIn("sketch.ino:2:1",caught.exception.details)
        self.assertEqual(len(cleaned),1)

    def test_worker_error_still_removes_container(self):
        cleaned = []
        def run(args):
            raise server.BuildError("BUILD_TIMEOUT",status=504)
        with self.assertRaises(server.BuildError):
            server.build({"protocol":server.PROTOCOL,"board":"esp32","source":"source"},run,cleaned.append)
        self.assertEqual(len(cleaned),1)


if __name__ == "__main__":
    unittest.main()
