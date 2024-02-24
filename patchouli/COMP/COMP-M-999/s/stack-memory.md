---
title = "Stack (memory)"
authors = [ "kyo" ]
---

The stack is a region in a [program]($p/program)'s [memory]($m/memory) where
data is allocated in a continuous block, with the last item on the stack being
the first to be deallocated (Last In, First Out; LIFO).

When a [function]($f/function) is called, its local [variables]($v/variable)
are *pushed* onto the stack in a *stack frame*. Once the function call ends,
its local variables go *out of scope* and the stack frame is *popped*.

Stack memory allocation is particularly convenient for [memory management]($m/memory-management)
as it happens automatically.
