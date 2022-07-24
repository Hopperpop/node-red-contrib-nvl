# node-red-contrib-nvl
[![NPM](https://img.shields.io/npm/l/node-red-contrib-nvl)](https://github.com/Hopperpop/node-red-contrib-nvl/blob/main/LICENSE)
[![GitHub](https://img.shields.io/badge/View%20on-GitHub-brightgreen)](https://github.com/Hopperpop/node-red-contrib-nvl)
[![npm](https://img.shields.io/npm/v/node-red-contrib-nvl)](https://www.npmjs.com/package/node-red-contrib-nvl)

Codesys network variable list parser for node-red. With these nodes and the standard udp nodes, you can receive and send data from/to a Codesys plc (Wago, KEB,...).
This is an improved version of [node-red-contrib-netvar](https://flows.nodered.org/node/node-red-contrib-netvar). And is build on top of [jisotalo](https://github.com/jisotalo) [iec-61131-3](https://github.com/jisotalo/iec-61131-3) library.

Supported datatypes:
- STRUCT, UNION, ARRAY
- ENUM
- STRING, WSTRING
- BOOL
- BYTE, WORD, DWORD
- USINT, UINT, UDINT
- SINT, INT, DINT
- ULINT, LWORD, LINT
- TIME, TOD, TIME_OF_DAY
- DT, DATE_AND_TIME, DATE
- REAL, LREAL


![node-red-contrib-nvl](https://user-images.githubusercontent.com/11853634/180651404-6e4dfcec-39a8-4b2b-ad70-1a76e0d3ca50.gif)

# Notice
- Switch to the monaco editor for syntax highlight. See: [discourse.nodered.or](https://discourse.nodered.org/t/getting-the-monaco-editor-to-work-in-nr-2-x/65466/2)
- Bugs can still exist. Contributing by providing raw data telegrams send from a Codesys controller with the associated nvl definiton are appreciated for further development.

# License
Copyright (c) 2021 Hopperpop


The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
