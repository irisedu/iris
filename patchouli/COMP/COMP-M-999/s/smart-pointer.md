---
title = "Smart pointer"
authors = [ "kyo" ]
---

A smart pointer is an object which performs [memory management]($m/memory-management)
by taking ownership of some data allocated on the [heap]($h/heap-memory)
(whose location is referred to by a [pointer]($p/pointer)) and automatically
freeing the associated memory when the smart pointer is destroyed.
