---
title = "Memory management"
authors = [ "kyo" ]
---

Memory management is the programming task of managing a [program]($p/program)'s
usage of [memory]($m/memory), especially [heap memory]($h/heap-memory). Possible
methods of memory management are typically dependent on [programming language]($p/programming-language).

## Types

In *manual memory management*, commonly used in [C]($c/c) and [C++]($c/cpp), the
programmer is responsible for creating and deleting memory allocations
themselves.

With a [*garbage collector*]($g/garbage-collector), in use for many modern
programming languages, a program called the garbage collector which runs
alongside the main program is responsible for clearing memory which is deemed
unused.

Some programming languages, including C++, provide [*smart pointers*]($s/smart-pointer)
to aid in memory management without the need for a garbage collector. Smart
pointers automatically deallocate the memory they own. If all heap objects
are eventually referred to by objects on the [stack]($s/stack-memory), all
heap memory can be freed automatically.
