const materialMap = {
  1: "Plastic",
  2: "Aluminum",
  3: "Steel",
  4: "Wood",
};

function getMaterialName(code) {
  return materialMap[code] || "Unknown";
}

function getMotherboardType(width) {
  if (!width) return { atx: false, matx: false, itx: false };
  return {
    atx: width >= 305,
    matx: width >= 244,
    itx: width <= 170,
  };
}

function parsePsuCompatibility(psuCompat) {
  if (!psuCompat || psuCompat === "None")
    return { atx: false, sfxl: false, sfx: false, flex: false };
  const parts = psuCompat.split("/").map((s) => s.trim().toLowerCase());
  return {
    atx: parts.some((p) => p === "atx"),
    sfxl: parts.some((p) => p === "sfx-l"),
    sfx: parts.some((p) => p === "sfx"),
    flex: parts.some((p) => p === "flex atx" || p === "flex"),
  };
}

const Checkbox = ({ checked, label }) => (
  <label className="inline-flex items-center gap-1 mx-2">
    <input
      type="checkbox"
      checked={checked}
      readOnly
      className="h-4 w-4 accent-blue-600 pointer-events-none"
    />
    <span className="text-sm">{label}</span>
  </label>
);

const CaseEndComponent = ({ data, id, imageUrls }) => {
  let imageUrl = `/images/${id}/1.jpg`;
  if (imageUrls) {
    try {
      const urls = JSON.parse(imageUrls);
      if (urls.length > 0) {
        imageUrl = urls[0];
      }
    } catch {
      // fallback
    }
  }

  const r = data.modes.results[0];
  const mbType = getMotherboardType(r.motherboard_width);
  const psuType = parsePsuCompatibility(r.psu_compatibility);

  return (
    <main className="sm:px-2">
      <div className="max-w-7xl flex flex-wrap sm:flex-nowrap xl:mx-auto">
        <div className="w-full py-4 mx-2 sm:mx-0">
          <div className="grid grid-cols-1 gap-4">
            {/* Case Image */}
            <div className="flex border-2 border-black justify-center items-center">
              <div className="max-h-96 flex justify-center w-full h-full">
                <img
                  src={imageUrl}
                  width="800"
                  height="800"
                  className="object-contain h-full"
                  alt={data.detail.name}
                />
              </div>
            </div>

            {/* Table 1: General Info */}
            <div className="w-full overflow-x-auto">
              <table className="w-full leading-8">
                <tbody>
                  <tr>
                    <th scope="row" className="w-1/4 font-bold">
                      Name
                    </th>
                    <td colSpan={4}>{data.detail.name}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="font-bold">
                      Source
                    </th>
                    <td colSpan={4}>
                      {data.detail.url ? (
                        <a
                          href={data.detail.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" rowSpan={2} className="font-bold">
                      Size
                    </th>
                    <th scope="col">Width(MM)</th>
                    <th scope="col">Height(MM)</th>
                    <th scope="col">Length(MM)</th>
                    <th scope="col">Volume(L)</th>
                  </tr>
                  <tr>
                    <td>{r.width || "-"}</td>
                    <td>{r.depth || "-"}</td>
                    <td>{r.height || "-"}</td>
                    <td>{r.volume || "-"}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="font-bold">
                      Main Material
                    </th>
                    <td colSpan={4}>{getMaterialName(r.skeleton_material)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="font-bold">
                      End of Life?
                    </th>
                    <td colSpan={4}>{data.detail.eol ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 2: Motherboard & PSU */}
            <div className="w-full overflow-x-auto">
              <table className="w-full leading-8">
                <tbody>
                  {/* Motherboard */}
                  <tr>
                    <th scope="row" rowSpan={4} className="w-1/4 font-bold">
                      Motherboard
                    </th>
                    <th scope="col" colSpan={4}>
                      Type
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <Checkbox checked={mbType.atx} label="ATX" />
                      <Checkbox checked={mbType.matx} label="Micro-ATX" />
                      <Checkbox checked={mbType.itx} label="Mini-ITX" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="col" colSpan={2}>
                      Width(MM)
                    </th>
                    <th scope="col" colSpan={2}>
                      Length(MM)
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={2}>{r.motherboard_width || "-"}</td>
                    <td colSpan={2}>{r.motherboard_length || "-"}</td>
                  </tr>

                  {/* Power Supply */}
                  <tr>
                    <th scope="row" rowSpan={4} className="font-bold">
                      Power Supply
                    </th>
                    <th scope="col" colSpan={4}>
                      Type
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <Checkbox checked={psuType.atx} label="ATX" />
                      <Checkbox checked={psuType.sfxl} label="SFX-L" />
                      <Checkbox checked={psuType.sfx} label="SFX" />
                      <Checkbox checked={psuType.flex} label="Flex" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="col">Length(MM)</th>
                    <th scope="col" colSpan={2}>
                      Width(MM)
                    </th>
                    <th scope="col">Height(MM)</th>
                  </tr>
                  <tr>
                    <td>{r.psu_length || "-"}</td>
                    <td colSpan={2}>{r.psu_width || "-"}</td>
                    <td>{r.psu_height || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 3: CPU & GPU */}
            <div className="w-full overflow-x-auto">
              <table className="w-full leading-8">
                <tbody>
                  {/* CPU */}
                  <tr>
                    <th scope="row" rowSpan={2} className="w-1/6 font-bold">
                      CPU
                    </th>
                    <th scope="col" colSpan={2}>
                      Height (MM)
                    </th>
                    <th scope="col" colSpan={4}>
                      Liquid Cooling
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={2}>{r.cpu_height || "-"}</td>
                    <td colSpan={4}>
                      <Checkbox checked={false} label="120mm" />
                      <Checkbox checked={false} label="140mm" />
                      <Checkbox checked={!!r.l240} label="240mm" />
                      <Checkbox checked={!!r.l280} label="280mm" />
                      <Checkbox checked={!!r.l360} label="360mm" />
                    </td>
                  </tr>

                  {/* GPU */}
                  <tr>
                    <th scope="row" rowSpan={4} className="font-bold">
                      GPU
                    </th>
                    <th scope="col" colSpan={3}>
                      PCI-E Riser
                    </th>
                    <th scope="col" colSpan={3}>
                      Slots
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={3}>{r.pcie_riser ? "Yes" : "No"}</td>
                    <td colSpan={3}>{r.slot || "-"}</td>
                  </tr>
                  <tr>
                    <th scope="col" colSpan={2}>
                      Length (MM)
                    </th>
                    <th scope="col" colSpan={2}>
                      Width (MM)
                    </th>
                    <th scope="col" colSpan={2}>
                      Height (MM)
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={2}>{r.gpu_length || "-"}</td>
                    <td colSpan={2}>{r.gpu_width || "-"}</td>
                    <td colSpan={2}>{r.gpu_height || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CaseEndComponent;
