---
title = "Heap (memory)"
authors = [ "kyo" ]
---

The heap is a region in a [program]($p/program)'s [memory]($m/memory) where
data is allocated in a discontinuous manner. Blocks of memory on the heap
are requested and reserved by the programmer, and must be freed manually
(although some features such as [smart pointers]($s/smart-pointer) can
perform this task automatically).

Heap allocation is most often used for data whose size is not known at
[compile time]($c/compiler).
