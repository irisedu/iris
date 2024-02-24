---
title = "Garbage collector"
authors = [ "kyo" ]
---

A garbage collector is a [program]($p/program) which runs alongside other
programs to automatically perform [memory management]($m/memory-management) by
clearing unused memory.

## Advantages

A garbage collector simplifies the task of memory management for the programmer,
especially as compared to manual memory management. Crucially, the programmer
need not worry about manually freeing [heap memory]($h/heap-memory).

## Disadvantages

Garbage collectors, depending on their implementation, may cause stutters if a
collection runs at an inconvenient time. This is particularly troublesome for
high-performance programs such as video games.
