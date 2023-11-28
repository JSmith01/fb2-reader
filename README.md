# Web FB2 Reader

This is a project to be able to read FB2 files using web browser only,
including ones inside `zip` archives.

Ideally, it should work completely offline.

Reader is partially based on XSL derived from [fb2any](https://github.com/gribuser/fb2any)
tool by [gribuser](https://github.com/gribuser).

Project uses [idb-keyval](https://github.com/jakearchibald/idb-keyval), and
[unzipit](https://github.com/greggman/unzipit) - both included in the project,
located in `/js/thirdparty` directory.


## Development notes

Uses Jest and Playwright, so it needs Node v18 or higher.
