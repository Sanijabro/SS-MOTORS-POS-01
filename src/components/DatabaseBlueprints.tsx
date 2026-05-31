import React, { useState } from "react";
import { Code, Database, FileCode, FolderClosed, Clipboard, Check } from "lucide-react";
import { SQL_SCHEMA_BLUEPRINT, LARAVEL_MIGRATION_BLUEPRINT, PHP_CONTROLLER_BLUEPRINT, FOLDER_STRUCTURE_REFERENCE } from "../database_blueprints";

export default function DatabaseBlueprints() {
  const [activeTab, setActiveTab] = useState<"mysql" | "migration" | "php" | "folders">("mysql");
  const [copied, setCopied] = useState(false);

  const getCodeString = () => {
    switch (activeTab) {
      case "mysql":
        return SQL_SCHEMA_BLUEPRINT;
      case "migration":
        return LARAVEL_MIGRATION_BLUEPRINT;
      case "php":
        return PHP_CONTROLLER_BLUEPRINT;
      case "folders":
        return FOLDER_STRUCTURE_REFERENCE;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col shadow-lg">
      {/* Tab Navigation header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("mysql")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "mysql"
                ? "bg-red-600 text-white"
                : "bg-slate-850 text-slate-400 hover:text-slate-100"
            }`}
          >
            <Database size={13} />
            <span>1. MySQL Schema (.sql)</span>
          </button>

          <button
            onClick={() => setActiveTab("migration")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "migration"
                ? "bg-red-600 text-white"
                : "bg-slate-850 text-slate-400 hover:text-slate-100"
            }`}
          >
            <FileCode size={13} />
            <span>2. Laravel Migrations</span>
          </button>

          <button
            onClick={() => setActiveTab("php")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "php"
                ? "bg-red-600 text-white"
                : "bg-slate-850 text-slate-400 hover:text-slate-100"
            }`}
          >
            <Code size={13} />
            <span>3. PHP POS Controller</span>
          </button>

          <button
            onClick={() => setActiveTab("folders")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "folders"
                ? "bg-red-600 text-white"
                : "bg-slate-850 text-slate-400 hover:text-slate-100"
            }`}
          >
            <FolderClosed size={13} />
            <span>4. Directory Structure</span>
          </button>
        </div>

        {/* Copy trigger */}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-700"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard size={13} />
              <span>Copy Blueprint Code</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed relative text-slate-350">
        <pre className="whitespace-pre overflow-x-auto selection:bg-red-950 selection:text-red-400">
          <code>{getCodeString()}</code>
        </pre>
      </div>
    </div>
  );
}
