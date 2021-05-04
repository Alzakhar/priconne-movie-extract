#define _CRT_SECURE_NO_WARNINGS
#define _WIN32_LEAN_AND_MEAN

#include <cstdint>
#include <memory>
#include <string>
#include <utility>

#include <Windows.h>

#include <sqlite3.h>

template<class Obj, class Del>
decltype(auto) Wrap(Obj *ptr, Del del) {
    return std::unique_ptr<Obj, Del>(ptr, del);
}
std::string ReadAll(const char *file) {
    std::string res;
    auto f = Wrap(fopen(file, "rb"), &fclose);
    char buf[4096];
    while (!feof(f.get()))
        res.append(buf, fread(buf, 1, sizeof(buf), f.get()));
    return res;
}

int main() {
    auto h = Wrap(LoadLibraryA("coneshell.dll"), &FreeLibrary);
    using Int = std::int32_t;
    using Long = std::int64_t;
    using IntPtr = void *;
    using ByteArray = char *;
    auto *_fx00 = (IntPtr (*)()) GetProcAddress(h.get(), "_fx00");
    auto *_a = (IntPtr (*)()) _fx00();
    auto *_e = (Int (*)(IntPtr, ByteArray, Int, ByteArray, Int)) _a();
    auto *_g = (Int (*)(IntPtr, ByteArray, Int)) _a();
    auto *_h = (Int (*)(IntPtr, Int, IntPtr, Int)) _a();
    auto *_c = (void (*)()) _a();
    auto *_i = (IntPtr (*)(ByteArray, Long, ByteArray)) _a();
    auto *_j = (void (*)(IntPtr)) _a();
    auto *_b = (Int (*)(ByteArray, ByteArray)) _a();
    auto *_d = (Int (*)(Int, Int)) _a();
    auto *_f = (Int (*)(Int)) _a();
    auto  cdb = ReadAll("master.cdb");
    char name[] {"master.mdb"};
    auto vfs = _i(cdb.data(), (Long) cdb.size(), name);
    auto res = sqlite3_vfs_register((sqlite3_vfs *) vfs, 0);
    if (res)
        return res;
    sqlite3 *psrc;
    res = sqlite3_open_v2(name, &psrc, SQLITE_OPEN_READONLY, name);
    if (res)
        return res;
    auto src = Wrap(psrc, &sqlite3_close);
    sqlite3 *pdst;
    res = sqlite3_open("master.mdb", &pdst);
    if (res)
        return res;
    auto dst = Wrap(pdst, &sqlite3_close);
    auto pbk = sqlite3_backup_init(pdst, "main", psrc, "main");
    if (!pbk)
        return -1;
    auto bk = Wrap(pbk, &sqlite3_backup_finish);
    res = sqlite3_backup_step(pbk, -1);
    if (res != SQLITE_DONE)
        return res;
    return 0;
}
