import { useState } from "react";
import "./App.css";
import {
  CheckCircle,
  DownloadIcon,
  FileText,
  ImageIcon,
  UploadIcon,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

import { Toaster } from "sonner";
import { toast } from "sonner";
import JSZip, { folder } from "jszip";

const MAX_LIMIT = 20;

function WebpConvertor() {
  const [selectTab, setSelectedTab] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [maxLimit, setMaxLimit] = useState(false);
  const [Quality, setQuality] = useState(80);
  const [isMaintainAspectRatio, setMaintainAspectRation] = useState("no");
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  const handleTabsChange = () => {
    if (selectTab === 0) {
      setSelectedTab(1);
    } else {
      setSelectedTab(0);
    }

    console.log(selectTab);
  };

  const handleUploadFiles = (files) => {
    let newUploadedFiles = [...uploadedFiles];
    let limitExceed = false;

    files.some((file) => {
      if (newUploadedFiles.findIndex((f) => (f.name === file.name) === -1)) {
        newUploadedFiles.push(file);

        if (newUploadedFiles.length === MAX_LIMIT) setMaxLimit(true);
        if (newUploadedFiles.length > MAX_LIMIT) {
          // alert(`Maximum ${MAX_LIMIT} files can be uploaded`);
          setMaxLimit(false);
          limitExceed = true;

          toast("One time Limit Exceed", {
            description: `Maximum ${MAX_LIMIT} files can be uploaded at a time`,
            action: {
              label: "OK",
              onClick: () => console.log("Undo"),
            },
          });
          return true;
        }
      }
    });

    if (!limitExceed) setUploadedFiles(newUploadedFiles);
  };

  const handleFileChange = (e) => {
    const choosenFiles = Array.prototype.slice.call(e.target.files);
    handleUploadFiles(choosenFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleUploadFiles(droppedFiles);
  };

  const onDragOver = (event) => {
    event.preventDefault(); // necessary to allow dropping
  };

  const handleDeleteFile = (file) => {
    let newFiles = [...uploadedFiles];

    let updatedFile = newFiles.filter((f, index) => f.name !== file.name);
    setUploadedFiles(updatedFile);
  };

  const handleDeleteConvertedFile = (file) => {
    let newFiles = [...uploadedFiles];

    let updatedFile = newFiles.filter((f, index) => f.name !== file.name);
    setConvertedFiles(updatedFile);
  };

  const handleConvertToWebp = async () => {
    const formData = new FormData();

    uploadedFiles?.forEach((file) => formData.append("images", file));

    try {
      setLoading(true);
      const res = await fetch(
        `https://webp-convertor-backend.onrender.com/upload?width=${width}&height=${height}&quality=${Quality}&maintainAspectRatio=${
          isMaintainAspectRatio === "yes" ? true : false
        }`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      console.log("data");

      if (data.urls) {
        const results = data.urls.map((url, i) => ({
          name: uploadedFiles[i].name,
          status: "Converted",
          url,
        }));
        setConvertedFiles(results);
        setLoading(false);
        setSelectedTab(1);
      } else {
        toast(`${data.error}` || "Convertion error", {
          action: {
            label: "OK",
            onClick: () => console.log("Undo"),
          },
        });
      }
    } catch (e) {
      console.error(e);
      toast(`Failed to upload or convert images`, {
        action: {
          label: "OK",
          onClick: () => console.log("Undo"),
        },
      });
      setError("Failed to upload or convert images");
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (convertedFiles?.length === 0) return;

    const zip = new JSZip();

    const folder = zip.folder("converted_file.zip");

    const fetchPromises = convertedFiles.map(async (file, i) => {
      try {
        const res = await fetch(file.url);

        const blob = await res.blob();

        const fileName = file.name.endsWith(".webp")
          ? file.name
          : `${file.name.split(".")[0]}.webp`;

        folder.file(fileName, blob);
      } catch (e) {
        console.log("Something went wrong while converting to zip");
        toast("Zip Convertion error", {
          action: {
            label: "OK",
            onClick: () => console.log("Undo"),
          },
        });
      }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.click();
  };

  // const handleSingleDownload = async (file) => {
  //   console.log(file);
  //   try {
  //     const res = await fetch(file.url);

  //     const content = await res.blob();

  //     console.log("content", content);

  //     const data = URL.createObjectURL(content);
  //     console.log(data);

  //     const name = file.endsWith(".webp")
  //       ? file.name
  //       : `${file.split(".")[0]}.webp`;

  //     const a = document.createElement("a");
  //     a.herf = data;
  //     a.download = name;

  //     a.click();
  //     console.log("Hello");
  //   } catch (e) {
  //     toast("File download error", {
  //       action: {
  //         label: "OK",
  //         onClick: () => console.log("Undo"),
  //       },
  //     });
  //   }
  // };

  const handleSingleDownload = async (file) => {
    console.log(file);
    try {
      const res = await fetch(file.url);
      const content = await res.blob();
      console.log("content", content);

      const data = URL.createObjectURL(content);
      console.log(data);

      const name = file.name.endsWith(".webp")
        ? file.name
        : `${file.name.split(".")[0]}.webp`;

      const a = document.createElement("a");
      a.href = data;
      a.download = name;
      document.body.appendChild(a); // ensure it's part of the DOM
      a.click();
      document.body.removeChild(a); // clean up
      console.log("Download triggered");
    } catch (e) {
      toast("File download error", {
        action: {
          label: "OK",
          onClick: () => console.log("Undo"),
        },
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-gray-100 gap-0 shadow-cyan-950 shadow-2xl">
      <CardHeader className="bg-gray-100 border-b-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon size={24} />
          WebP Image Converter
        </CardTitle>
        <CardDescription className="pb-4">
          Convert your images to WebP format for faster loading websites
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white py-4">
        <div className="p-1 bg-gray-100 rounded-b-sm flex justify-between">
          <div
            className={`flex justify-center items-center px-2 md:px-0 gap-0 lg:gap-2 py-1 flex-1 text-center min-h-[20px] transition-all cursor-pointer text-[12px] lg:text-[16px] ${
              selectTab === 0 ? "bg-white text-black" : "text-gray-600"
            }`}
            onClick={() => handleTabsChange()}
          >
            <UploadIcon size={18} />
            Upload & Convert
          </div>
          <div
            className={`flex justify-center items-center px-2 md:px-0 gap-0 lg:gap-2 py-1 flex-1 text-center min-h-[20px] text-[12px] lg:text-[16px] transition-all cursor-pointer ${
              selectTab === 1 ? "bg-white text-black" : "  text-gray-600"
            }`}
            onClick={() => handleTabsChange()}
          >
            <DownloadIcon size={18} />
            Download Files
          </div>
        </div>
        {selectTab === 0 && (
          <>
            <div className="py-4 flex flex-col gap-1">
              <p className="text-[18px] font-bold">Select Images to Convert</p>
              <label
                htmlFor="fileUpload"
                className="border-dashed border-2 px-2 py-6 flex w-full justify-center items-center flex-col gap-2 text-gray-600 text-[14px]"
              >
                <UploadIcon size={32} color="gray" />
                <p>
                  <b>Click to upload</b> or drag and drop
                </p>
                <p>PNG,JPG,GIF,WEBP (Max 20 files)</p>
              </label>
              <input
                id="fileUpload"
                multiple
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={maxLimit}
                onDrop={handleDrop}
                onDragOver={onDragOver}
              />
            </div>
            {uploadedFiles?.length > 0 && (
              <div className="py-4 flex flex-col gap-1">
                <p className="text-[18px] font-bold">
                  Selected Files ({uploadedFiles?.length}/{MAX_LIMIT})
                </p>
                <ul className="flex flex-col gap-2 overflow-y-scroll max-h-[150px]">
                  {uploadedFiles?.map((file, index) => (
                    <li
                      key={index}
                      className="p-2 bg-gray-100 flex items-center justify-between "
                    >
                      <p>{file.name}</p>
                      <XCircle
                        size={16}
                        className="cursor-pointer"
                        onClick={() => handleDeleteFile(file)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="py-4 flex flex-col gap-1">
              <p className="text-[18px] font-bold">Quality:{Quality}%</p>
              <Slider
                defaultValue={[Quality]}
                // value={Quality}
                max={100}
                step={1}
                className="py-2"
                onValueChange={(value) => setQuality(value)}
              />
            </div>
            <div className="py-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-[18px] font-bold">
                  Width<small className="text-[12px]">(Optional)</small>
                </Label>
                <Input
                  min={0}
                  max={5000}
                  type="number"
                  placeholder="Original Width"
                  onChange={(e) => {
                    if (e.target.value > 5000) {
                      console.log(e.target.value);
                      toast("Maximum 5000px width allowed", {
                        description: ``,
                      });
                      return false;
                    } else {
                      setWidth(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <Label className="text-[18px] font-bold">
                  Height<small className="text-[12px]">(Optional)</small>
                </Label>
                <Input
                  min={0}
                  max={5000}
                  type="number"
                  placeholder="Original Height"
                  onChange={(e) => {
                    if (e.target.value > 5000) {
                      console.log(e.target.value);
                      toast("Maximum 5000px height allowed", {
                        description: ``,
                      });
                      return false;
                    } else {
                      setHeight(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
            <div className="py-4 flex flex-col">
              <Label className="text-[18px] font-bold">
                Maintain aspect ratio
                <small className="text-[12px]">(Optional)</small>
              </Label>
              <RadioGroup
                defaultValue="No"
                className="py-4 flex flex-col md:flex-row gap-4"
                onValueChange={(value) => setMaintainAspectRation(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="option-one" />
                  <Label htmlFor="option-one">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="option-two" />
                  <Label htmlFor="option-two">No</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="py-4 flex flex-col">
              <Button
                className={`p-6 text-[18px] cursor-pointer ${
                  loading ? "bg-gray-400" : "bg-black"
                } `}
                onClick={() => handleConvertToWebp()}
              >
                {loading ? "Converting..." : "Convert to WebP"}
              </Button>
            </div>
          </>
        )}

        {selectTab === 1 && convertedFiles.length == 0 && (
          <>
            <div className="py-4 flex w-full flex-col text-center items-center justify-center gap-1">
              <ImageIcon size={48} color="gray" className="w-full" />

              <p className="text-[18px] font-bold">No converted files yet</p>
              <p className="text-gray-600">
                Convert some images first to see them here
              </p>
              <Button
                className="w-[200px] mt-6"
                variant="outline"
                onClick={() => setSelectedTab(0)}
              >
                Go To Upload
              </Button>
            </div>
          </>
        )}
        {selectTab === 1 && convertedFiles.length > 0 && (
          <>
            {convertedFiles?.length > 0 && (
              <div className="py-4 flex flex-col gap-1">
                <div className="flex items-center justify-between w-full mb-2">
                  <p className="text-[18px] font-bold">Converted Files</p>
                  <Button variant="outline" onClick={handleDownloadZip}>
                    <span>
                      <FileText className="h-4 w-4" />
                    </span>
                    Download as ZIP
                  </Button>
                </div>

                <ul className="flex flex-col gap-2 overflow-y-scroll max-h-[150px]">
                  {convertedFiles?.map((file, index) => (
                    <li
                      key={index}
                      className="p-2 bg-gray-100 flex items-center justify-between "
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p>{file.name}</p>
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={() => handleSingleDownload(file)}
                      >
                        {/* <a
                          href={file.url}
                          target="_black"
                          rel="noopener noreferrer"
                          download
                        >
                          {" "}
                          <DownloadIcon
                            size={16}
                            className="text-blue-500 cursor-pointer"
                          />
                        </a> */}
                        <DownloadIcon
                          size={16}
                          className="text-blue-500 cursor-pointer"
                        />

                        <XCircle
                          size={16}
                          className="cursor-pointer text-red-500"
                          onClick={() => handleDeleteConvertedFile(file)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <p className="text-sm text-muted-foreground">
          Convert up to 20 images at once • Max dimensions: 5000px
        </p>
      </CardFooter>
      <Toaster position="top-center" />
    </Card>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-700 p-4 md:p-8 flex items-center justify-center">
      <WebpConvertor />
    </div>
  );
}

export default App;
