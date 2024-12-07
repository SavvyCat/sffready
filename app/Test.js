import React from "react";

const CaseEndComponent = ({ data, id }) => {
  console.log(data);
  return (
    <>
      <main className="sm:px-2">
        <div className="max-w-7xl flex flex-wrap sm:flex-nowrap xl:mx-auto">
          <div className="w-full py-4 mx-2 sm:mx-0">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col justify-between">
                <div className="flex border-2 border-black h-full justify-center items-center">
                  <div className="max-h-96 flex justify-center w-full h-full">
                    <img
                      src={`/images/${id}/1.jpg`}
                      width="800"
                      height="800"
                      className="object-contain h-full"
                      alt={data.detail.name}
                    />
                  </div>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full leading-8">
                  <tbody>
                    <tr>
                      <th scope="col" colSpan={2}>
                        Name
                      </th>
                      <td colSpan={4}>{data.detail.name}</td>
                    </tr>
                    <tr>
                      <th scope="col" colSpan={2}>
                        Source
                      </th>
                      <td colSpan={4}>
                        <a
                          href={data.detail.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Link
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={3}>
                        Size
                      </th>
                      <th scope="row">\\</th>
                      <th scope="col">Short(MM)</th>
                      <th scope="col">Medium(MM)</th>
                      <th scope="col">Long(MM)</th>
                      <th scope="col">Volume(L)</th>
                    </tr>
                    <tr>
                      <th scope="row">Body</th>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{data.modes.results[0].volume}</td>
                    </tr>
                    <tr>
                      <th scope="row">Package</th>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={2}>
                        Weight(KG)
                      </th>
                      <th scope="row">Body</th>
                      <td colSpan={4}>-</td>
                    </tr>
                    <tr>
                      <th scope="row">Package</th>
                      <td colSpan={4}>-</td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={2}>
                        Material
                      </th>
                      <th scope="row">Skeleton</th>
                      <td colSpan={4}>
                        {data.modes.results[0].skeleton_material === 3
                          ? "Steel"
                          : "Unknown"}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Shell</th>
                      <td colSpan={4}>
                        {data.modes.results[0].shell_material === 3
                          ? "Steel"
                          : "Unknown"}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={2} colSpan={2}>
                        Side Panel
                      </th>
                      <th scope="col">Open</th>
                      <th scope="col">Solid</th>
                      <th scope="col">Mesh</th>
                      <th scope="col">Transparent</th>
                    </tr>
                    <tr>
                      <td>{data.modes.results[0].open_panel ? "Yes" : "No"}</td>
                      <td>
                        {data.modes.results[0].solid_panel ? "Yes" : "No"}
                      </td>
                      <td
                        className={`badge ${
                          data.modes.results[0].mesh_panel ? "bg-zinc-600" : ""
                        }`}
                      >
                        {data.modes.results[0].mesh_panel ? "Yes" : "No"}
                      </td>
                      <td>
                        {data.modes.results[0].transparent_panel ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={2} colSpan={2}>
                        Extra
                      </th>
                      <th scope="row" colSpan={2}>
                        EOL
                      </th>
                      <th scope="row" colSpan={2}>
                        USB-C
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={2}>{data.detail.eol ? "Yes" : "No"}</td>
                      <td
                        colSpan={2}
                        className={`badge ${
                          data.modes.results[0].usb_c ? "bg-zinc-600" : ""
                        }`}
                      >
                        {data.modes.results[0].usb_c ? "Yes" : "No"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Additional Tables */}
              <div className="w-full overflow-x-auto">
                <table className="w-full leading-8">
                  <tbody>
                    <tr>
                      <th scope="row" rowSpan={4} colSpan={2}>
                        Motherboard
                      </th>
                      <th scope="col" colSpan={4}>
                        Type
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={4}>M-ATX</td>
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
                      <td colSpan={2}>
                        {data.modes.results[0].motherboard_width}
                      </td>
                      <td colSpan={2}>
                        {data.modes.results[0].motherboard_length}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan={4} colSpan={2}>
                        Power Supply
                      </th>
                      <th scope="col" colSpan={2}>
                        Type
                      </th>
                      <th scope="col">Width(MM)</th>
                      <th scope="col">Height(MM)</th>
                    </tr>
                    <tr>
                      <td colSpan={2}>ATX 12V</td>
                      <td>{data.modes.results[0].psu_width}</td>
                      <td>{data.modes.results[0].psu_height}</td>
                    </tr>
                    <tr>
                      <th scope="col" colSpan={4}>
                        Length(MM)
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={4}>{data.modes.results[0].psu_length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full leading-8">
                  <tbody>
                    <tr>
                      <th scope="row" rowSpan="2" colSpan="2">
                        CPU
                      </th>
                      <th scope="col" colSpan="2">
                        Height (MM)
                      </th>
                      <th scope="col" colSpan="3">
                        Liquid Cooling
                      </th>
                    </tr>
                    <tr>
                      <td colSpan="2">{data.modes.results[0].cpu_height}</td>
                      <td colSpan="2">
                        {data.modes.results[0].l240 && (
                          <span className="badge bg-zinc-600 text-white p-0.5 m-1 text-sm">
                            240MM
                          </span>
                        )}
                        {data.modes.results[0].l280 && (
                          <span className="badge bg-zinc-600 text-white p-0.5 m-1 text-sm">
                            280MM
                          </span>
                        )}
                        {data.modes.results[0].l360 && (
                          <span className="badge bg-zinc-600 text-white p-0.5 m-1 text-sm">
                            360MM
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" rowSpan="6" colSpan="2">
                        GPU
                      </th>
                      <th scope="col" colSpan="2">
                        PCI-E Riser
                      </th>
                      <th scope="col">Width (MM)</th>
                      <th scope="col">Height (MM)</th>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        {data.modes.results[0].pcie_riser ? "Yes" : "No"}
                      </td>
                      <td>{data.modes.results[0].gpu_width}</td>
                      <td>{data.modes.results[0].gpu_height}</td>
                    </tr>
                    <tr>
                      <th scope="col" colSpan="4">
                        Length (MM)
                      </th>
                    </tr>
                    <tr>
                      <td colSpan="4">{data.modes.results[0].gpu_length}</td>
                    </tr>
                    <tr>
                      <th scope="col">Full</th>
                      <th scope="col">Low</th>
                      <th scope="col">Extra Full</th>
                      <th scope="col">Extra Low</th>
                    </tr>
                    <tr>
                      <td>{data.modes.results[0].slot}</td>
                      <td>{data.modes.results[0].low_profile_slot || "-"}</td>
                      <td>{data.modes.results[0].extra_slot || "-"}</td>
                      <td>
                        {data.modes.results[0].extra_low_profile_slot || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CaseEndComponent;
