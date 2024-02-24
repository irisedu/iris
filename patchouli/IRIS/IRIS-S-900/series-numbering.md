---
title = "Series numbering"
authors = [ "kyo" ]
---

## Sections

Each series number contains 4 sections in the format `ABCD-X-123YZ`:

- Category (`ABCD`): a 4 letter abbreviation describing the general category the
  series falls into.
- Series type (`X`): a letter indicating the type of series.
- Number (`123`): the 1--3 digit number of the series within the category.
- Extension letters (`YZ`): additional letters describing separate series
  grouped by the same number.

## Categories

| Category | Usage                            |
|----------|----------------------------------|
| ARTS     | General art                      |
| COMP     | Computer science                 |
| IRIS     | Iris itself                      |
| MATH     | Mathematics                      |
| META     | Learning (regardless of subject) |
| PLAY     | Gameplay                         |
| TECH     | High-level technology            |

## Series types

| Type letter | Meaning                                          |
|-------------|--------------------------------------------------|
| C           | Course (guided material)                         |
| S           | Series (articles with shared topic)              |
| M           | Miscellaneous (articles at most loosely related) |

## Series numbers

| Number range | Usage                     |
|--------------|---------------------------|
| 0--299       | "Beginner"                |
| 300--599     | "Intermediate"            |
| 600--899     | "Advanced"                |
| 900--998     | Miscellaneous or internal |
| 999          | Topic glossary            |

## Extension letters

| Extension letter | Usage                      |
|------------------|----------------------------|
| X                | Extension/companion series |

## Reservations

### COMP

| Code                      | Description                    |
|---------------------------|--------------------------------|
| COMP-*-0                  | Hello, World!                  |
|                           | Data Structures and Algorithms |
| COMP-M-900                | Miscellaneous Computer Science |
| [COMP-M-999](@comp-m-999) | Computer Science Glossary      |

### IRIS

| Code                  | Description      |
|-----------------------|------------------|
| [IRIS-S-1](@iris-s-1) | Welcome to Iris! |
| [IRIS-S-900]($)       | Iris Internals   |

### META

| Code     | Description |
|----------|-------------|
| META-*-0 | Why learn?  |


### MATH

| Code                      | Description                    |
|---------------------------|--------------------------------|
| MATH-*-0                  | Elementary Mathematics         |
| MATH-S-10                 | Math Notation Reference        |
| MATH-*-50                 | Pre-algebra                    |
| MATH-*-100                | Algebra and Trigonometry       |
| MATH-*-120                | Geometry                       |
| MATH-*-250                | Pre-calculus                   |
| MATH-*-300                | Calculus in One Variable       |
| MATH-*-350                | Linear Algebra                 |
| MATH-*-360                | Calculus in Multiple Variables |
| [MATH-M-900](@math-m-900) | Miscellaneous Mathematics      |
| [MATH-M-999](@math-m-999) | Mathematics Glossary           |

### TECH

| Code       | Description              |
|------------|--------------------------|
|            | Open Source              |
|            | The Free Internet        |
|            | Typesetting with LaTeX   |
|            | Introduction to Linux    |
| TECH-M-900 | Miscellaneous Technology |
| TECH-M-999 | Technology Glossary      |
