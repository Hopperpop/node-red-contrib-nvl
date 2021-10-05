# node-red-contrib-nvl

Codesys network variable list parser for node-red. With these nodes and the standard udp nodes, you can recieve and send data from/to a Codesys plc.
This is an improved version of https://flows.nodered.org/node/node-red-contrib-netvar. And is build on top of [jisotalo](https://github.com/jisotalo) [iec-61131-3](https://github.com/jisotalo/iec-61131-3) library.

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


![afbeelding](https://user-images.githubusercontent.com/11853634/136016642-57c9fdd0-a048-474c-ad2c-983352c89916.png)


# Notice
This node hasn't been tested througly yet with real hardware. Bugs can still exist. Contributing by providing raw data telegrams send from a Codesys controller with the associated nvl definiton are appreciated for further development.

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
